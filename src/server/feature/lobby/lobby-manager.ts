import { randomUUID } from 'node:crypto';

import type { Player, GameSession, Gamemode, Difficulty } from '../../../shared/types';
import { MULTIPLAYER_CAP, SINGLEPLAYER_CAP, SESSION_DURATION_MS, NICKNAME_REGEX } from '../../../shared/config';
import { lobbyStore, type LobbyRecord } from './lobby-store';
import { LOBBY_CLEANUP_INTERVAL_MS } from '../../config';
import { dedupeNickname } from './utils/nickname';
import { deriveShareUrl } from './utils/url';

export class LobbyManager {

  constructor() {
    setInterval(() => lobbyStore.cleanupEmptyLobbies(), LOBBY_CLEANUP_INTERVAL_MS);
  }

 public createLobby(params: {
    playerId: string;
    nickname: string;
    color: string;
    baseUrl: string;
  }): {lobby?: LobbyRecord, error?: string} {
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

    if (!NICKNAME_REGEX.test(params.nickname)) { 
      return { lobby: undefined, error: 'Invalid nickname' };
    }

    return { 
      lobby: {
        lobbyId,
        players: [player],
        gamemode: 'multiplayer',
        difficulty: 'easy',
        singleplayerSettings: {
          opponents: [],
        },
        maxPlayers: MULTIPLAYER_CAP,
        status: 'waiting',
        shareUrl,
        createdAt: new Date().toISOString(),
        joinCounter: 1,
        waiting: [],
      },
      error: undefined,
    };
  }

  public joinLobby(
    lobby: LobbyRecord,
    params: { playerId: string; nickname: string; color: string }
  ): { player?: Player; waiting: boolean; error?: string } {
    const capacity = lobby.maxPlayers;
    const isFull = lobby.players.length >= capacity;
    const waiting = lobby.status === 'active';

    if (!waiting && isFull) {
      return { waiting, error: 'Lobby is full' };
    }

    if (!NICKNAME_REGEX.test(params.nickname)) { 
      return { waiting, error: 'Invalid nickname' };
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
    return { player, waiting };
  }

  public leaveLobby(lobby: LobbyRecord, playerId: string): void {
    lobby.players = lobby.players.filter((p) => p.id !== playerId);
    lobby.waiting = lobby.waiting.filter((p) => p.id !== playerId);
    this.ensureLeader(lobby);

    if (lobby.status === 'waiting') {
      this.admitWaiting(lobby);
    }
  }

  public updateSettings(
    lobby: LobbyRecord,
    params: {
      leaderId: string;
      gamemode: Gamemode;
      difficulty: Difficulty;
      singleplayerSettings?: LobbyRecord['singleplayerSettings'];
    }
  ): { kicked: Player[]; error?: string } {
    if (!this.isLeader(lobby, params.leaderId)) return { kicked: [], error: 'Not leader' };

    lobby.gamemode = params.gamemode;
    lobby.difficulty = params.difficulty;
    if (params.singleplayerSettings) {
      lobby.singleplayerSettings = params.singleplayerSettings;
    }
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
    return { kicked };
  }

  public createGame(lobby: LobbyRecord, leaderId: string): { session: GameSession | null; error?: string } {
    if (!this.isLeader(lobby, leaderId)) return { session: null, error: 'Not leader' };
    if (lobby.players.length > lobby.maxPlayers) return { session: null, error: 'Capacity exceeded' };

    const session: GameSession = {
      sessionId: randomUUID().slice(0, 8),
      lobbyId: lobby.lobbyId,
      status: 'active',
      timerRemainingMs: SESSION_DURATION_MS,
      leaderboard: [],
    };

    lobby.status = 'active';
    lobby.activeSession = session;
    return { session };
  }

  public endGame(lobby: LobbyRecord, seatsAvailable: number): void {
    if (!lobby.activeSession) return;

    lobby.activeSession = { ...lobby.activeSession, status: 'ended', seatsAvailable };
    lobby.status = 'waiting';
    this.admitWaiting(lobby);
  }

  public getWaitingPosition(lobby: LobbyRecord, playerId: string): number | null {
    const index = lobby.waiting.findIndex((player) => player.id === playerId);
    return index === -1 ? null : index + 1;
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

// Export a singleton instance
export const lobbyManager = new LobbyManager();
