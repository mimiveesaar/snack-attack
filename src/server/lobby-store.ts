import { randomUUID } from 'node:crypto';
import { Player, LobbyState, GameSession, Gamemode, Difficulty } from '../shared/types';



const MULTIPLAYER_CAP = 4;
const SINGLEPLAYER_CAP = 1;
const SESSION_DURATION_MS = 30_000;

function nowIso(): string {
  return new Date().toISOString();
}

function deriveShareUrl(baseUrl: string, lobbyId: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/lobby/${lobbyId}`;
}

function dedupeNickname(players: Player[], nicknameBase: string): string {
  let maxSuffix = 0;
  for (const p of players) {
    if (p.nicknameBase !== nicknameBase) continue;
    const match = p.nicknameDisplay.match(/\((\d+)\)$/);
    const suffix = match ? Number(match[1]) : 1;
    maxSuffix = Math.max(maxSuffix, suffix);
  }
  return maxSuffix === 0 ? nicknameBase : `${nicknameBase} (${maxSuffix + 1})`;
}

export interface LobbyRecord extends LobbyState {
  players: Player[];
  activeSession?: GameSession;
  joinCounter: number;
  waiting: Player[];
}

export class LobbyStore {
  private lobbies = new Map<string, LobbyRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  startCleanup(intervalMs = 5 * 60 * 1000): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => this.cleanupEmptyLobbies(), intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  createLobby(params: {
    playerId: string;
    nickname: string;
    color: string;
    baseUrl: string;
  }): LobbyRecord {
    const lobbyId = randomUUID().slice(0, 8);
    const shareUrl = deriveShareUrl(params.baseUrl, lobbyId);
    const player: Player = {
      id: params.playerId,
      nicknameBase: params.nickname,
      nicknameDisplay: params.nickname,
      color: params.color,
      isLeader: true,
      joinOrder: 1,
      connected: true,
    };

    const record: LobbyRecord = {
      lobbyId,
      players: [player],
      gamemode: 'multiplayer',
      difficulty: 'easy',
      maxPlayers: MULTIPLAYER_CAP,
      status: 'waiting',
      shareUrl,
      createdAt: nowIso(),
      joinCounter: 1,
      waiting: [],
    };

    this.lobbies.set(lobbyId, record);
    return record;
  }

  joinLobby(params: {
    lobbyId: string;
    playerId: string;
    nickname: string;
    color: string;
  }): { state: LobbyRecord | null; player?: Player; kicked?: string[]; waiting?: boolean; error?: string } {
    const lobby = this.lobbies.get(params.lobbyId);
    if (!lobby) return { state: null };

    const capacity = lobby.maxPlayers;
    const isFull = lobby.players.length >= capacity;
    const waiting = lobby.status === 'active';
    if (!waiting && isFull) {
      return { state: lobby, error: 'Lobby is full' };
    }

    const nicknameDisplay = dedupeNickname([...lobby.players, ...lobby.waiting], params.nickname);
    const player: Player = {
      id: params.playerId,
      nicknameBase: params.nickname,
      nicknameDisplay,
      color: params.color,
      isLeader: false,
      joinOrder: lobby.joinCounter + 1,
      connected: true,
    };
    lobby.joinCounter += 1;

    if (!waiting) {
      lobby.players.push(player);
    } else {
      lobby.waiting.push(player);
    }

    this.ensureLeader(lobby);
    return { state: lobby, player, waiting };
  }

  leaveLobby(lobbyId: string, playerId: string): { state: LobbyRecord | null; deleted: boolean } {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { state: null, deleted: false };

    lobby.players = lobby.players.filter((p) => p.id !== playerId);
    lobby.waiting = lobby.waiting.filter((p) => p.id !== playerId);
    this.ensureLeader(lobby);

    if (lobby.status === 'waiting') {
      this.admitWaiting(lobby);
    }

    if (lobby.players.length === 0) {
      this.lobbies.delete(lobbyId);
      return { state: null, deleted: true };
    }

    return { state: lobby, deleted: false };
  }

  updateSettings(params: {
    lobbyId: string;
    leaderId: string;
    gamemode: Gamemode;
    difficulty: Difficulty;
  }): { state: LobbyRecord | null; kicked?: Player[]; error?: string } {
    const lobby = this.lobbies.get(params.lobbyId);
    if (!lobby) return { state: null, error: 'Lobby not found' };
    if (!this.isLeader(lobby, params.leaderId)) return { state: null, error: 'Not leader' };

    lobby.gamemode = params.gamemode;
    lobby.difficulty = params.difficulty;
    lobby.maxPlayers = params.gamemode === 'singleplayer' ? SINGLEPLAYER_CAP : MULTIPLAYER_CAP;

    const kicked: Player[] = [];
    if (lobby.players.length > lobby.maxPlayers) {
      const sorted = [...lobby.players].sort((a, b) => {
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return a.joinOrder - b.joinOrder;
      });
      const keep = sorted.slice(0, lobby.maxPlayers);
      const keepIds = new Set(keep.map((p) => p.id));
      for (const player of lobby.players) {
        if (!keepIds.has(player.id)) kicked.push(player);
      }
      lobby.players = keep;
    }

    this.ensureLeader(lobby);
    this.admitWaiting(lobby);
    return { state: lobby, kicked };
  }

  startGame(lobbyId: string, leaderId: string): { session: GameSession | null; error?: string } {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { session: null, error: 'Lobby not found' };
    if (!this.isLeader(lobby, leaderId)) return { session: null, error: 'Not leader' };
    if (lobby.players.length > lobby.maxPlayers) return { session: null, error: 'Capacity exceeded' };

    const session: GameSession = {
      sessionId: randomUUID().slice(0, 8),
      lobbyId,
      status: 'active',
      timerRemainingMs: SESSION_DURATION_MS,
      leaderboard: [],
    };

    console.log(`LobbyStore: Created game session ${session.sessionId} for lobby ${lobbyId}`);
    console.log(`LobbyStore: Session has ${lobby.players.length} players:`, lobby.players.map(p => ({ id: p.id, nickname: p.nicknameDisplay })));

    lobby.status = 'active';
    lobby.activeSession = session;
    return { session };
  }

  endGame(lobbyId: string, seatsAvailable: number): { lobby: LobbyRecord | null } {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { lobby: null };
    if (!lobby.activeSession) return { lobby };

    lobby.activeSession = { ...lobby.activeSession, status: 'ended', seatsAvailable };
    lobby.status = 'waiting';
    this.admitWaiting(lobby);
    return { lobby };
  }

  getState(lobbyId: string): LobbyRecord | null {
    return this.lobbies.get(lobbyId) ?? null;
  }

  getWaitingPlayers(lobbyId: string): Player[] {
    return this.lobbies.get(lobbyId)?.waiting ?? [];
  }

  getWaitingPosition(lobbyId: string, playerId: string): number | null {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;
    const index = lobby.waiting.findIndex((player) => player.id === playerId);
    return index === -1 ? null : index + 1;
  }

  list(): LobbyRecord[] {
    return Array.from(this.lobbies.values());
  }

  cleanupEmptyLobbies(): void {
    for (const [id, lobby] of this.lobbies) {
      if (lobby.players.length === 0) {
        this.lobbies.delete(id);
      }
    }
  }

  private admitWaiting(lobby: LobbyRecord): void {
    const openSlots = lobby.maxPlayers - lobby.players.length;
    if (openSlots <= 0 || lobby.waiting.length === 0) return;
    const toAdmit = lobby.waiting.splice(0, openSlots);
    lobby.players.push(...toAdmit);
    this.ensureLeader(lobby);
  }

  private ensureLeader(lobby: LobbyRecord): void {
    if (lobby.players.some((p) => p.isLeader)) return;
    if (lobby.players.length === 0) return;
    lobby.players[0].isLeader = true;
  }

  private isLeader(lobby: LobbyRecord, playerId: string): boolean {
    return lobby.players.some((p) => p.id === playerId && p.isLeader);
  }
}

export const lobbyStore = new LobbyStore();
