import type { GameSessionState } from '../../../game/state';
import type { CollisionEvent } from '../types';
import { circleCollide } from '../geometry';
import { canEat } from '../rules';

/**
 * Process eating collisions for all players vs NPCs
 * Resolved in joinOrder to ensure deterministic ordering
 */
export const processEatingCollisions = (session: GameSessionState): CollisionEvent[] => {
  const events: CollisionEvent[] = [];
  const state = session.getState();

  // Sort players by joinOrder for deterministic collision resolution
  const sortedPlayers = [...state.players].sort((a, b) => {
    const orderA = a.id === state.players[0]?.id ? 0 : 1;
    const orderB = b.id === state.players[0]?.id ? 0 : 1;
    return orderA - orderB;
  });

  // Track NPCs to remove (can't modify array while iterating)
  const npcIndicesToRemove: number[] = [];

  // Check each player against each NPC
  for (const player of sortedPlayers) {
    if (player.status !== 'alive') continue;
    if (session.isPlayerInGrace(player.id)) continue; // Skip if in grace period

    for (let npcIdx = 0; npcIdx < state.npcs.length; npcIdx++) {
      const npc = state.npcs[npcIdx];

      // Check collision
      if (circleCollide(player.position, player.collisionRadius, npc.position, npc.collisionRadius)) {
        // Check if player can eat this NPC
        if (canEat(player.collisionRadius, npc.collisionRadius)) {
          // Apply double XP if player has that power-up
          let xpGain = npc.xp;
          if (player.powerups.includes('double-xp')) {
            xpGain *= 2;
          }

          // Transfer XP to player
          session.updatePlayerXp(player.id, xpGain);

          // Mark NPC for removal
          if (!npcIndicesToRemove.includes(npcIdx)) {
            npcIndicesToRemove.push(npcIdx);
          }

          // Record event
          events.push({
            type: 'fish-eaten',
            tick: state.serverTick,
            data: {
              eatenNpcId: npc.id,
              eatenByPlayerId: player.id,
              xpTransferred: xpGain,
              playerNewXp: player.xp,
            },
          });
        }
      }
    }
  }

  // Remove eaten NPCs (in reverse order to maintain indices)
  npcIndicesToRemove.sort((a, b) => b - a);
  for (const idx of npcIndicesToRemove) {
    state.npcs.splice(idx, 1);
  }

  return events;
};
