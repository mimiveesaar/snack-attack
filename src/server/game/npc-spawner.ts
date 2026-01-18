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
  pink: 2500, // 2.5s - spawns as swarms
  grey: 2000, // 2s
  brown: 3000, // 3s
};

const MAX_CONCURRENT: Record<'pink' | 'grey' | 'brown', number> = {
  pink: 15,  // Most common (spawns in groups)
  grey: 5,   // Medium frequency
  brown: 3,  // Rare but visible
};

const SWARM_SIZE = 3; // Number of pink fish to spawn together
const SWARM_RADIUS = 40; // How spread out the swarm is

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

    // For pink fish, spawn as a swarm
    if (type === 'pink') {
      this.spawnSwarm(session, now);
    } else {
      this.spawnSingleNPC(session, type, now);
    }

    this.lastSpawnTime[type] = now;
  }

  /**
   * Spawn a swarm of pink fish
   */
  private spawnSwarm(session: GameSessionState, now: number): void {
    const state = session.getState();
    
    // Find safe spawn location for swarm center
    const centerPos = this.findSafeSpawnLocation(session);
    if (!centerPos) {
      return; // Can't find safe location
    }

    const currentCount = state.npcs.filter((n: { type: string; }) => n.type === 'pink').length;
    const spawnCount = Math.min(SWARM_SIZE, MAX_CONCURRENT['pink'] - currentCount);

    // Spawn multiple pink fish around the center position
    for (let i = 0; i < spawnCount; i++) {
      const angle = (Math.PI * 2 * i) / spawnCount;
      const distance = Math.random() * SWARM_RADIUS;
      const x = Math.max(BOUNDARY_BUFFER, Math.min(GAME_WIDTH - BOUNDARY_BUFFER, 
        centerPos.x + Math.cos(angle) * distance));
      const y = Math.max(BOUNDARY_BUFFER, Math.min(GAME_HEIGHT - BOUNDARY_BUFFER, 
        centerPos.y + Math.sin(angle) * distance));

      const npcId = `npc-${this.spawnCounter++}-${Date.now()}-${i}`;
      
      state.npcs.push({
        id: npcId,
        type: 'pink',
        xp: 10,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        collisionRadius: 6,
        visualSize: 0.45,
        status: 'alive',
        spawnTimeMs: now,
      });
    }
  }

  /**
   * Spawn a single NPC (grey or brown)
   */
  private spawnSingleNPC(session: GameSessionState, type: 'grey' | 'brown', now: number): void {
    const state = session.getState();
    
    // Find safe spawn location
    const spawnPos = this.findSafeSpawnLocation(session);
    if (!spawnPos) {
      return; // Can't find safe location
    }

    // Create NPC
    const npcId = `npc-${this.spawnCounter++}-${Date.now()}`;
    const xpMap: Record<'grey' | 'brown', number> = { grey: 25, brown: 50 };
    const sizeMap: Record<'grey' | 'brown', number> = { grey: 0.7, brown: 0.95 };
    const radiusMap: Record<'grey' | 'brown', number> = { grey: 9, brown: 12 };

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
