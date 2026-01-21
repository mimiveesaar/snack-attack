import type { GameSessionState } from '../../../game/state';
import type { CollisionEvent } from '../types';
import { circleCollide } from '../geometry';

/**
 * Process player-vs-player eating (higher XP eats lower XP)
 */
export const processPlayersEatingPlayers = (session: GameSessionState): CollisionEvent[] => {
  const events: CollisionEvent[] = [];
  const state = session.getState();
  const playersToRespawn = new Set<string>();

  for (let i = 0; i < state.players.length; i++) {
    const playerA = state.players[i];
    if (playerA.status !== 'alive') continue;

    for (let j = i + 1; j < state.players.length; j++) {
      const playerB = state.players[j];
      if (playerB.status !== 'alive') continue;

      if (playersToRespawn.has(playerA.id) || playersToRespawn.has(playerB.id)) continue;

      if (!circleCollide(playerA.position, playerA.collisionRadius, playerB.position, playerB.collisionRadius)) {
        continue;
      }

      if (playerA.xp === playerB.xp) continue;

      const eater = playerA.xp > playerB.xp ? playerA : playerB;
      const target = playerA.xp > playerB.xp ? playerB : playerA;

      console.log(
        `[Collision] Eater: ${eater.nicknameDisplay} (XP: ${eater.xp}) vs ${target.nicknameDisplay} (XP: ${target.xp})`
      );

      if (session.isPlayerInGrace(target.id)) continue;
      if (target.powerups.includes('invincibility')) continue;

      if (!playersToRespawn.has(target.id)) {
        playersToRespawn.add(target.id);
        const targetXp = target.xp;

        console.log(`[Collision] Player eaten: ${target.nicknameDisplay} eaten by ${eater.nicknameDisplay}`);

        events.push({
          type: 'fish-eaten',
          tick: state.serverTick,
          data: {
            eatenPlayerId: target.id,
            eatenByPlayerId: eater.id,
            playerLostXp: targetXp,
          },
        });
      }
    }
  }

  for (const playerId of playersToRespawn) {
    session.setPlayerRespawning(playerId, 2000);
  }

  return events;
};
