import { GameSessionState } from '../../game/state';
import type { Difficulty } from '../../../shared/lobby';
import type { GamePlayerInit } from '../../game/state';

/**
 * Global game session store (in-memory)
 */
const sessionStore = new Map<string, GameSessionState>();

export function createGameSession(
  sessionId: string,
  lobbyId: string,
  players: GamePlayerInit[],
  difficulty: Difficulty,
): GameSessionState {
  const session = new GameSessionState(sessionId, lobbyId, players, difficulty);
  sessionStore.set(sessionId, session);
  return session;
}

export function getGameSession(sessionId: string): GameSessionState | undefined {
  return sessionStore.get(sessionId);
}

export function deleteGameSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function getAllGameSessions(): Map<string, GameSessionState> {
  return sessionStore;
}