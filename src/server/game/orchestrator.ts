import type { Namespace } from 'socket.io';
import type { GameClientToServerEvents, GameServerToClientEvents } from '../../shared/game-events';
import { createGameSession, getGameSession, deleteGameSession } from '../feature/session/session-store';
import { createGameLoop, deleteGameLoop, getGameLoop } from './loop-store';

export interface GamePlayerInit {
  id: string;
  nicknameDisplay: string;
  color: string;
}

export class GameOrchestrator {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
  private activeSessions: Map<string, { createdAt: number }> = new Map();

  constructor(gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>) {
    this.gameNamespace = gameNamespace;
  }

  startSession(sessionId: string, lobbyId: string, players: GamePlayerInit[]): boolean {
    if (this.activeSessions.has(sessionId)) {
      console.warn(`GameOrchestrator: Session ${sessionId} already active`);
      return false;
    }

    console.log(`GameOrchestrator: Starting session ${sessionId} for lobby ${lobbyId} with ${players.length} players`);
    console.log(`GameOrchestrator: Players:`, players.map(p => ({ id: p.id, nickname: p.nicknameDisplay })));

    try {
      // Create game state
      const session = createGameSession(sessionId, lobbyId, players);
      console.log(`GameOrchestrator: Game session created and stored with sessionId: ${sessionId}`);


      // Create and start game loop
      const loop = createGameLoop(sessionId, this.gameNamespace);
      loop.start();
      console.log(`GameOrchestrator: Game loop started for session ${sessionId}`);

      // Track session
      this.activeSessions.set(sessionId, {
        createdAt: Date.now(),
      });

      console.log(`GameOrchestrator: Session ${sessionId} successfully started and tracked`);
      return true;
    } catch (error) {
      console.error(`GameOrchestrator: Failed to start session ${sessionId}:`, error);
      return false;
    }
  }

  stopSession(sessionId: string): boolean {
    if (!this.activeSessions.has(sessionId)) {
      return false;
    }

    console.log(`GameOrchestrator: Stopping session ${sessionId}`);

    try {

      const loop = getGameLoop(sessionId);
      if (loop) {
        loop.end();
      }

      // Stop game loop
      deleteGameLoop(sessionId);

      // Delete game state
      deleteGameSession(sessionId);

      // Untrack session
      this.activeSessions.delete(sessionId);

      return true;
    } catch (error) {
      console.error(`GameOrchestrator: Failed to stop session ${sessionId}:`, error);
      return false;
    }
  }

  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

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

// Singleton instance - initialized on first use
export const gameOrchestrator = new Proxy({} as GameOrchestrator, {
  get(_target, prop) {
    if (!orchestrator) {
      throw new Error('GameOrchestrator not initialized. Call createGameOrchestrator first.');
    }
    return (orchestrator as any)[prop];
  },
});
