import type { GameSessionState } from '../../../game/state';
import type { CollisionEvent } from '../types';
import { circleCollide } from '../geometry';

/**
 * Process powerup collisions (players collecting powerups)
 */
export const processPowerupCollisions = (session: GameSessionState): CollisionEvent[] => {
  const events: CollisionEvent[] = [];
  const state = session.getState();

  // Track powerups to collect
  const powerupsToCollect: string[] = [];

  // Check each player against each powerup
  for (const player of state.players) {
    if (player.status !== 'alive') continue;

    for (const powerup of state.powerups) {
      if (powerup.status !== 'available') continue;

      // Check collision
      if (circleCollide(player.position, player.collisionRadius, powerup.position, powerup.collisionRadius)) {
        // Mark powerup as collected
        if (!powerupsToCollect.includes(powerup.id)) {
          powerupsToCollect.push(powerup.id);

          // Apply powerup to player (10 second duration)
          session.addPlayerPowerup(player.id, powerup.type, 10000);

          // Record event
          console.log(`[Collision] Powerup collected: ${powerup.type} by ${player.nicknameDisplay}`, {
            powerupId: powerup.id,
            playerId: player.id,
            playerName: player.nicknameDisplay,
          });

          events.push({
            type: 'powerup-collected',
            tick: state.serverTick,
            data: {
              powerupId: powerup.id,
              powerupType: powerup.type,
              collectedByPlayerId: player.id,
              collectedByPlayerName: player.nicknameDisplay,
            },
          });
        }
      }
    }
  }

  // Mark collected powerups
  for (const powerupId of powerupsToCollect) {
    const powerup = state.powerups.find((p) => p.id === powerupId);
    if (powerup) {
      powerup.status = 'collected';
    }
  }

  return events;
};
