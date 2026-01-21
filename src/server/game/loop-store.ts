import type { Namespace } from 'socket.io';
import type { GameClientToServerEvents, GameServerToClientEvents } from '../../shared/game-events';
import { GameLoop } from './loop';

const loopStore = new Map<string, GameLoop>();

export function createGameLoop(
  sessionId: string,
  gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>
): GameLoop {
  const loop = new GameLoop(sessionId, gameNamespace);
  loopStore.set(sessionId, loop);
  return loop;
}

export function getGameLoop(sessionId: string): GameLoop | undefined {
  return loopStore.get(sessionId);
}

export function deleteGameLoop(sessionId: string): void {
  const loop = loopStore.get(sessionId);
  if (loop) {
    loop.stop();
  }
  loopStore.delete(sessionId);
}
