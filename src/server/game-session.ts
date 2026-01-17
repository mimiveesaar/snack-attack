import { lobbyStore } from './lobby-store';
import type { Namespace, Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types';

const SESSION_DURATION_MS = 30_000;

export class GameSessionManager {
  private timers = new Map<string, NodeJS.Timeout>();

  start(
    lobbyId: string,
    io: Server<ClientToServerEvents, ServerToClientEvents> | Namespace<ClientToServerEvents, ServerToClientEvents>
  ): void {
    this.stop(lobbyId);
    const lobby = lobbyStore.getState(lobbyId);
    if (!lobby || !lobby.activeSession) return;

    lobby.activeSession.timerRemainingMs = SESSION_DURATION_MS;
    const timeout = setTimeout(() => {
      const result = lobbyStore.endGame(lobbyId, lobby.maxPlayers - lobby.players.length);
      const endedSession = result.lobby?.activeSession || lobby.activeSession;
      if (result.lobby && endedSession) {
        io.to(lobbyId).emit('game:ended', endedSession);
        io.to(lobbyId).emit('lobby:state', {
          lobbyId: result.lobby.lobbyId,
          players: result.lobby.players,
          gamemode: result.lobby.gamemode,
          difficulty: result.lobby.difficulty,
          maxPlayers: result.lobby.maxPlayers,
          status: result.lobby.status,
          shareUrl: result.lobby.shareUrl,
          createdAt: result.lobby.createdAt,
        });
      }
      this.stop(lobbyId);
    }, SESSION_DURATION_MS);

    this.timers.set(lobbyId, timeout);
  }

  stop(lobbyId: string): void {
    const timer = this.timers.get(lobbyId);
    if (timer) clearTimeout(timer);
    this.timers.delete(lobbyId);
  }
}

export const gameSessionManager = new GameSessionManager();
