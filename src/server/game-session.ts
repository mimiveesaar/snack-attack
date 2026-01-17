import { lobbyStore } from './lobby-store';
import type { Namespace, Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, GameClientToServerEvents, GameServerToClientEvents } from '@shared/types';
import { gameOrchestrator } from './game/orchestrator';

const SESSION_DURATION_MS = 30_000; // 30 seconds total game time (NOTE: Should be 120_000 for 2 minutes, but using 30s for testing)

export class GameSessionManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents> | null = null;

  /**
   * Set the game namespace for broadcasting events
   */
  setGameNamespace(ns: Namespace<GameClientToServerEvents, GameServerToClientEvents>): void {
    this.gameNamespace = ns;
  }

  start(
    lobbyId: string,
    io: Server<ClientToServerEvents, ServerToClientEvents> | Namespace<ClientToServerEvents, ServerToClientEvents>
  ): void {
    this.stop(lobbyId);
    const lobby = lobbyStore.getState(lobbyId);
    if (!lobby || !lobby.activeSession) return;

    // Create session ID (using lobbyId as sessionId for now)
    const sessionId = lobbyId;

    // Convert lobby players to game player format
    const gameOrchestrationPlayers = lobby.players.map((player: any, idx: number) => ({
      id: player.id,
      nicknameDisplay: player.nickname,
      color: player.color || '#ff0000',
      isLeader: player.isLeader || idx === 0,
    }));

    // Start the game session via orchestrator (if game namespace is available)
    if (this.gameNamespace) {
      console.log(`GameSessionManager: Starting game session ${sessionId} with ${gameOrchestrationPlayers.length} players`);
      try {
        gameOrchestrator.startSession(
          sessionId,
          lobbyId,
          gameOrchestrationPlayers
        );
      } catch (error) {
        console.error(`GameSessionManager: Failed to start game session: ${error}`);
      }
    }

    lobby.activeSession.timerRemainingMs = SESSION_DURATION_MS;
    const timeout = setTimeout(() => {
      // Stop game session via orchestrator
      gameOrchestrator.stopSession(sessionId);

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
