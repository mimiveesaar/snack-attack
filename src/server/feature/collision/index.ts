import type { GameSessionState } from '../../game/state';
import type { CollisionEvent } from './types';
import { processBoundaryCollisions } from './checks/boundary.check';
import { processEatingCollisions } from './checks/players-eating-npc.check';
import { processNPCsEatingPlayers } from './checks/npcs-eating-player.check';
import { processPlayersEatingPlayers } from './checks/player-eating-player.check';
import { processPowerupCollisions } from './checks/player-powerup.check';

export class CollisionManager {

public processCollisions(session: GameSessionState): CollisionEvent[] {

    processBoundaryCollisions(session);

    const eatingEvents = processEatingCollisions(session);

    const playerEatingEvents = processPlayersEatingPlayers(session);

    const npcEatingEvents = processNPCsEatingPlayers(session);

    const powerupEvents = processPowerupCollisions(session);


    return [...eatingEvents, ...powerupEvents, ...playerEatingEvents, ...npcEatingEvents];
  }
}

export const collisionDetector = new CollisionManager();
export type { CollisionEvent } from './types';