import type { GameSessionState } from '../../../game/state';
import type { CollisionEvent } from '../types';
import { circleCollide } from '../geometry';
import { canEat } from '../rules';

/**
 * Process NPCs eating players (when NPC is bigger)
 */
export const processNPCsEatingPlayers = (session: GameSessionState): CollisionEvent[] => {
  const events: CollisionEvent[] = [];
  const state = session.getState();

  // Track players to respawn
  const playersToRespawn: string[] = [];

  // Check each NPC against each player
  for (const npc of state.npcs) {
    for (const player of state.players) {
      if (player.status !== 'alive') continue;
      if (session.isPlayerInGrace(player.id)) continue; // Skip if in grace period
      if (player.powerups.includes('invincibility')) continue; // Immune while invincible

      // Check collision
      if (circleCollide(npc.position, npc.collisionRadius, player.position, player.collisionRadius)) {
        // Check if NPC can eat this player (NPC radius >= player radius)
        if (canEat(npc.collisionRadius, player.collisionRadius)) {
          // Mark player for respawn
          if (!playersToRespawn.includes(player.id)) {
            playersToRespawn.push(player.id);

            // Record event
            events.push({
              type: 'fish-eaten',
              tick: state.serverTick,
              data: {
                eatenPlayerId: player.id,
                eatenByNpcId: npc.id,
                playerLostXp: player.xp,
              },
            });
          }
        }
      }
    }
  }

  // Trigger respawn for eaten players
  for (const playerId of playersToRespawn) {
    session.setPlayerRespawning(playerId, 2000); // 2 second respawn delay
  }

  return events;
};
