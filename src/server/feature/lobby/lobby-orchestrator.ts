import { randomUUID } from 'node:crypto';
import { Player, GameSession, Gamemode, Difficulty } from '../../../shared/types';
import { deriveShareUrl } from './utils/shareUrl';
import { nowIso } from '@shared/utils/time';
import { dedupeNickname } from './utils/dedupeNickname';
import { lobbyStore, type LobbyRecord } from './lobby-store';

const MULTIPLAYER_CAP = 4;
const SINGLEPLAYER_CAP = 1;
const SESSION_DURATION_MS = 30_000;

// Start periodic cleanup of empty lobbies.
lobbyStore.startCleanup();

export class LobbyOrchestrator {
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

    lobbyStore.setLobby(lobbyId, record);
    return record;
  }

  joinLobby(params: {
    lobbyId: string;
    playerId: string;
    nickname: string;
    color: string;
  }): { state: LobbyRecord | null; player?: Player; kicked?: string[]; waiting?: boolean; error?: string } {
    const lobby = lobbyStore.getState(params.lobbyId);
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
    const lobby = lobbyStore.getState(lobbyId);
    if (!lobby) return { state: null, deleted: false };

    lobby.players = lobby.players.filter((p) => p.id !== playerId);
    lobby.waiting = lobby.waiting.filter((p) => p.id !== playerId);
    this.ensureLeader(lobby);

    if (lobby.players.length === 0) {
      lobbyStore.removeLobby(lobbyId);
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
    const lobby = lobbyStore.getState(params.lobbyId);
    if (!lobby) return { state: null, error: 'Lobby not found' };
    if (!this.isLeader(lobby, params.leaderId)) return { state: null, error: 'Not leader' };

    lobby.gamemode = params.gamemode;
    lobby.difficulty = params.difficulty;

    if (params.gamemode === 'singleplayer') {
      lobby.maxPlayers = SINGLEPLAYER_CAP;
    } else {
      lobby.maxPlayers = MULTIPLAYER_CAP;
    }

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
    const lobby = lobbyStore.getState(lobbyId);
    if (!lobby) {
      return { session: null, error: 'Lobby not found' };
    }
    if (!this.isLeader(lobby, leaderId)) {
      return { session: null, error: 'Not leader' };
    }
    if (lobby.players.length > lobby.maxPlayers) {
      return { session: null, error: 'Capacity exceeded' };
    }

    const session: GameSession = {
      sessionId: randomUUID().slice(0, 8),
      lobbyId,
      status: 'active',
      timerRemainingMs: SESSION_DURATION_MS,
      leaderboard: [],
    };

    lobby.status = 'active';
    lobby.activeSession = session;
    return { session };
  }

  endGame(lobbyId: string, seatsAvailable: number): { lobby: LobbyRecord | null } {
    const lobby = lobbyStore.getState(lobbyId);
    if (!lobby) return { lobby: null };
    if (!lobby.activeSession) return { lobby };

    lobby.activeSession = { ...lobby.activeSession, status: 'ended', seatsAvailable };
    lobby.status = 'waiting';
    this.admitWaiting(lobby);
    return { lobby };
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

export const lobbyOrchestrator = new LobbyOrchestrator();
