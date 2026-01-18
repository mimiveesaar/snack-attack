/**
 * NPC Spawner - Server-side NPC spawning logic
 *
 * Responsibilities:
 * - Spawn NPCs at intervals (Pink, Grey, Brown with frequencies)
 * - Check spawn safety (minimum distance from players)
 * - Enforce NPC type caps
 * - Passive movement/AI
 */

import type { GameSessionState } from './state';

const SPAWN_INTERVALS: Record<'pink' | 'grey' | 'brown', number> = {
  pink: 1500, // 1.5s
  grey: 4000, // 4s
  brown: 8000, // 8s
};

const MAX_CONCURRENT: Record<'pink' | 'grey' | 'brown', number> = {
  pink: 5,
  grey: 3,
  brown: 1,
};

const SPAWN_DISTANCE = 50; // pixels from any player
const BOUNDARY_BUFFER = 20;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 800;

export class NPCSpawner {
  private lastSpawnTime: Record<'pink' | 'grey' | 'brown', number> = {
    pink: 0,
    grey: 0,
    brown: 0,
  };
  private spawnCounter = 0;

  /**
   * Try to spawn NPCs for a session
   */
  tick(session: GameSessionState): void {
    const now = Date.now();

    this.trySpawn(session, 'pink', now);
    this.trySpawn(session, 'grey', now);
    this.trySpawn(session, 'brown', now);
  }

  /**
   * Try to spawn an NPC of given type
   */
  private trySpawn(session: GameSessionState, type: 'pink' | 'grey' | 'brown', now: number): void {
    const lastSpawn = this.lastSpawnTime[type];
    const interval = SPAWN_INTERVALS[type];

    if (now - lastSpawn < interval) {
      return; // Not yet time
    }

    const state = session.getState();

    // Check current count
    const currentCount = state.npcs.filter((n: { type: string; }) => n.type === type).length;
    if (currentCount >= MAX_CONCURRENT[type]) {
      return; // At capacity
    }

    // Find safe spawn location
    const spawnPos = this.findSafeSpawnLocation(session);
    if (!spawnPos) {
      return; // Can't find safe location
    }

    // Create NPC
    const npcId = `npc-${this.spawnCounter++}-${Date.now()}`;
    const xpMap: Record<'pink' | 'grey' | 'brown', number> = { pink: 10, grey: 25, brown: 50 };
    const sizeMap: Record<'pink' | 'grey' | 'brown', number> = { pink: 1.0, grey: 1.2, brown: 1.5 };
    const radiusMap: Record<'pink' | 'grey' | 'brown', number> = { pink: 10, grey: 14, brown: 18 };

    state.npcs.push({
      id: npcId,
      type,
      xp: xpMap[type],
      position: spawnPos,
      velocity: { x: 0, y: 0 },
      collisionRadius: radiusMap[type],
      visualSize: sizeMap[type],
      status: 'alive',
      spawnTimeMs: now,
    });

    this.lastSpawnTime[type] = now;
    console.log(`NPCSpawner: Spawned ${type} NPC at (${spawnPos.x}, ${spawnPos.y})`);
  }

  /**
   * Find a safe spawn location (away from all players)
   */
  private findSafeSpawnLocation(session: GameSessionState): { x: number; y: number } | null {
    const state = session.getState();
    const attempts = 10;

    for (let i = 0; i < attempts; i++) {
      const x = BOUNDARY_BUFFER + Math.random() * (GAME_WIDTH - 2 * BOUNDARY_BUFFER);
      const y = BOUNDARY_BUFFER + Math.random() * (GAME_HEIGHT - 2 * BOUNDARY_BUFFER);

      // Check distance to all players
      let safe = true;
      for (const player of state.players) {
        const dx = x - player.position.x;
        const dy = y - player.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SPAWN_DISTANCE) {
          safe = false;
          break;
        }
      }

      if (safe) {
        return { x, y };
      }
    }

    return null; // Couldn't find safe location
  }
}

export const npcSpawner = new NPCSpawner();
