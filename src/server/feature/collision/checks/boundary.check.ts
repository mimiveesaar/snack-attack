import type { GameSessionState } from '../../../game/state';

import { GAME_BOUNDARY } from '../../../../shared/game-config';

export const isBoundaryCollision = (x: number, y: number, radius: number): boolean =>
  x - radius < GAME_BOUNDARY.buffer ||
  x + radius > GAME_BOUNDARY.width - GAME_BOUNDARY.buffer ||
  y - radius < GAME_BOUNDARY.buffer ||
  y + radius > GAME_BOUNDARY.height - GAME_BOUNDARY.buffer;

export const clampToBoundary = (x: number, y: number, radius: number): { x: number; y: number } => ({
  x: Math.max(radius + GAME_BOUNDARY.buffer, Math.min(GAME_BOUNDARY.width - radius - GAME_BOUNDARY.buffer, x)),
  y: Math.max(radius + GAME_BOUNDARY.buffer, Math.min(GAME_BOUNDARY.height - radius - GAME_BOUNDARY.buffer, y)),
});

export const processBoundaryCollisions = (session: GameSessionState): void => {
  const state = session.getState();

  for (const player of state.players) {
    if (isBoundaryCollision(player.position.x, player.position.y, player.collisionRadius)) {
      const clamped = clampToBoundary(player.position.x, player.position.y, player.collisionRadius);
      player.position = clamped;
    }
  }

  for (const npc of state.npcs) {
    if (isBoundaryCollision(npc.position.x, npc.position.y, npc.collisionRadius)) {
      const clamped = clampToBoundary(npc.position.x, npc.position.y, npc.collisionRadius);
      npc.position = clamped;

      // Reverse velocity to bounce
      npc.velocity.x *= -1;
      npc.velocity.y *= -1;
    }
  }
};