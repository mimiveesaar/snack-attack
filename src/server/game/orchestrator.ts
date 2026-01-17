/**
 * Game Orchestrator - Manages active game sessions
 *
 * Responsibilities:
 * - Create new game sessions
 * - Track active sessions
 * - Manage session lifecycle
 * - Coordinate session start/stop
 */

import type { Namespace } from 'socket.io';
import type { Player } from '@shared/types';
import type { GameClientToServerEvents, GameServerToClientEvents } from '@shared/game-events';
import { createGameSession, getGameSession, deleteGameSession } from './state';
import { createGameLoop, deleteGameLoop } from './loop';
import { createPlayerClockSync } from './clock';

export class GameOrchestrator {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
  private activeSessions: Map<string, { createdAt: number }> = new Map();

  constructor(gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>) {
    this.gameNamespace = gameNamespace;
  }

  /**
   * Create and start a new game session
   */
  startSession(sessionId: string, lobbyId: string, players: Player[]): boolean {
    if (this.activeSessions.has(sessionId)) {
      console.warn(`GameOrchestrator: Session ${sessionId} already active`);
      return false;
    }

    console.log(`GameOrchestrator: Starting session ${sessionId} with ${players.length} players`);

    try {
      // Create game state
      const session = createGameSession(sessionId, lobbyId, players);

      // Create player clock sync records
      players.forEach((p) => {
        createPlayerClockSync(p.id);
      });

      // Create and start game loop
      const loop = createGameLoop(sessionId, this.gameNamespace);
      loop.start();

      // Track session
      this.activeSessions.set(sessionId, {
        createdAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error(`GameOrchestrator: Failed to start session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Stop and clean up a game session
   */
  stopSession(sessionId: string): boolean {
    if (!this.activeSessions.has(sessionId)) {
      return false;
    }

    console.log(`GameOrchestrator: Stopping session ${sessionId}`);

    try {
      // Stop game loop
      deleteGameLoop(sessionId);

      // Delete game state
      const session = getGameSession(sessionId);
      if (session) {
        const state = session.getState();
        state.players.forEach((p) => {
          // Clean up player clock sync
          // deletePlayerClockSync(p.id); // TODO: implement if needed
        });
      }
      deleteGameSession(sessionId);

      // Untrack session
      this.activeSessions.delete(sessionId);

      return true;
    } catch (error) {
      console.error(`GameOrchestrator: Failed to stop session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Check if session is active
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }
}

let orchestrator: GameOrchestrator | null = null;

export function createGameOrchestrator(
  gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>
): GameOrchestrator {
  orchestrator = new GameOrchestrator(gameNamespace);
  return orchestrator;
}

export function getGameOrchestrator(): GameOrchestrator | null {
  return orchestrator;
}
