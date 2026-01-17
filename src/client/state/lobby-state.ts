import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  GameSession,
  LobbyState,
  ServerToClientEvents,
  WaitingPayload,
} from '@shared/types';
import { getLobbyIdFromUrl, resetLobbyUrl, setLobbyUrl } from './router';

export type ViewMode = 'entry' | 'lobby' | 'waiting';

export interface ClientState {
  view: ViewMode;
  lobby: LobbyState | null;
  waiting: WaitingPayload | null;
  activeSession: GameSession | null;
  error: string | null;
  clipboardFeedback: string | null;
  selfId: string | null;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

class LobbyClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private listeners = new Set<(state: ClientState) => void>();
  private state: ClientState = {
    view: 'entry',
    lobby: null,
    waiting: null,
    activeSession: null,
    error: null,
    clipboardFeedback: null,
    selfId: null,
  };

  constructor() {
    this.socket = io(`${SOCKET_URL}/lobby`, {
      transports: ['websocket'],
    });
    this.registerHandlers();
  }

  subscribe(fn: (state: ClientState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  getState(): ClientState {
    return this.state;
  }

  async createLobby(nickname: string, color: string): Promise<void> {
    this.setState({ error: null });
    this.socket.emit('lobby:create', { nickname, color }, (state: LobbyState | null) => {
      if (!state) {
        this.setState({ error: 'Unable to create lobby' });
        return;
      }
      setLobbyUrl(state.lobbyId);
      this.setState({ lobby: state, view: 'lobby', waiting: null, activeSession: null });
    });
  }

  async joinLobby(nickname: string, color: string): Promise<void> {
    const lobbyId = getLobbyIdFromUrl();
    if (!lobbyId) {
      this.setState({ error: 'No lobby id provided' });
      return;
    }
    this.setState({ error: null });
    this.socket.emit('lobby:join', { lobbyId, nickname, color }, (state: LobbyState | null) => {
      if (!state) return; // waiting cases handled via server events
      this.setState({ lobby: state, view: 'lobby', waiting: null });
    });
  }

  updateSettings(payload: { gamemode: LobbyState['gamemode']; difficulty: LobbyState['difficulty']; lobbyId: string }): void {
    this.socket.emit('lobby:updateSettings', payload, (state: LobbyState | null) => {
      if (state) this.setState({ lobby: state, view: 'lobby', waiting: null });
    });
  }

  startGame(lobbyId: string): void {
    this.socket.emit('lobby:start', { lobbyId }, (session: GameSession | null) => {
      if (session) {
        this.setState({ activeSession: session });
      }
    });
  }

  leaveLobby(): void {
    const lobbyId = this.state.lobby?.lobbyId;
    if (!lobbyId) return;
    this.socket.emit('lobby:leave', { lobbyId });
    resetLobbyUrl();
    this.setState({ lobby: null, view: 'entry', waiting: null, activeSession: null });
  }

  setClipboardFeedback(message: string | null): void {
    this.setState({ clipboardFeedback: message });
  }

  private registerHandlers(): void {
    this.socket.on('connect', () => {
      this.setState({ selfId: this.socket.id });
    });

    this.socket.on('disconnect', () => {
      this.setState({ selfId: null });
    });

    this.socket.on('lobby:state', (state) => {
      setLobbyUrl(state.lobbyId);
      this.setState({ lobby: state, view: 'lobby', waiting: null, activeSession: null });
    });

    this.socket.on('lobby:kicked', () => {
      resetLobbyUrl();
      this.setState({ lobby: null, view: 'entry', waiting: null, error: 'You were removed from the lobby' });
    });

    this.socket.on('lobby:error', (payload) => {
      this.setState({ error: payload.message });
    });

    this.socket.on('game:waiting', (payload) => {
      this.setState({ waiting: payload, view: 'waiting', activeSession: null });
    });

    this.socket.on('game:started', (session) => {
      this.setState({ activeSession: session, waiting: null, view: 'lobby' });
    });

    this.socket.on('game:ended', (session) => {
      this.setState({ activeSession: session, waiting: null, view: 'lobby' });
    });
  }

  private setState(patch: Partial<ClientState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const lobbyClient = new LobbyClient();
