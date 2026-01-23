import { lobbyStore } from '../lobby/lobby-store';
import { lobbyManager } from '../lobby/lobby-manager';
import type { Namespace, Server } from 'socket.io';

import { gameOrchestrator } from '../../game/orchestrator';
import { getGameSession } from './session-store';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/events';
import { ActiveGameSnapshot } from '../../../shared/game-session';
import { GameClientToServerEvents, GameServerToClientEvents } from '../../../shared/game-events';
import { SESSION_DURATION_MS } from '../../../shared/config';

export class GameSessionManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents> | null = null;

  setGameNamespace(ns: Namespace<GameClientToServerEvents, GameServerToClientEvents>): void {
    this.gameNamespace = ns;
  }

  getActiveGameSnapshot(lobbyId: string): ActiveGameSnapshot {
    const lobby = lobbyStore.get(lobbyId);
    if (!lobby || lobby.status !== 'active' || !lobby.activeSession) {
      return { hasActiveGame: false, timerRemainingMs: null, leaderboard: [] };
    }

    const session = getGameSession(lobby.activeSession.sessionId);
    if (!session) {
      return { hasActiveGame: false, timerRemainingMs: null, leaderboard: [] };
    }

    const state = session.getState();
    const leaderboard = state.leaderboard.map((entry, index) => ({
      playerId: entry.id,
      nicknameDisplay: entry.nicknameDisplay,
      score: entry.xp,
      rank: index + 1,
    }));

    return {
      hasActiveGame: true,
      timerRemainingMs: session.getTimeRemainingMs(),
      leaderboard,
    };
  }

  start(
    lobbyId: string,
    io: Server<ClientToServerEvents, ServerToClientEvents> | Namespace<ClientToServerEvents, ServerToClientEvents>
  ): void {
    this.stop(lobbyId);
    const lobby = lobbyStore.get(lobbyId);
    if (!lobby || !lobby.activeSession) {
      return;
    } 

    // Use the session ID created by lobby manager
    const sessionId = lobby.activeSession.sessionId;

    // Convert lobby players to game player format
    const gameOrchestrationPlayers = lobby.players.map((player: any, idx: number) => ({
      id: player.id,
      nicknameDisplay: player.nicknameDisplay,
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

      lobbyManager.endGame(lobby, lobby.maxPlayers - lobby.players.length);
      const endedSession = lobby.activeSession;
      if (endedSession) {
        io.to(lobbyId).emit('game:ended', endedSession);
        io.to(lobbyId).emit('lobby:state', {
          lobbyId: lobby.lobbyId,
          players: lobby.players,
          gamemode: lobby.gamemode,
          difficulty: lobby.difficulty,
          maxPlayers: lobby.maxPlayers,
          status: lobby.status,
          shareUrl: lobby.shareUrl,
          createdAt: lobby.createdAt,
        });
      }
      this.stop(lobbyId);
    }, SESSION_DURATION_MS);

    this.timers.set(lobbyId, timeout);
  }

  stop(lobbyId: string): void {
    const timer = this.timers.get(lobbyId);
    if (timer) {
      clearTimeout(timer);
    }     
    this.timers.delete(lobbyId);
  }
}

// Export a singleton instance
export const gameSessionManager = new GameSessionManager();