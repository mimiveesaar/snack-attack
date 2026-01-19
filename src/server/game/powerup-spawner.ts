/**
 * Powerup Spawner - Server-side powerup spawning logic
 *
 * Responsibilities:
 * - Spawn powerups at 10-second intervals
 * - Enforce powerup count cap (max 5 concurrent)
 * - Find safe spawn locations away from players
 * - Log powerup spawn events
 */

import type { GameSessionState } from './state';

const SPAWN_INTERVAL = 10000; // 10 seconds between powerups
const MAX_CONCURRENT_POWERUPS = 5;
const POWERUP_LIFETIME = 30000; // 30 seconds before despawning

const SPAWN_DISTANCE = 50; // pixels away from any player
const BOUNDARY_BUFFER = 20;
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1000;

export class PowerupSpawner {
  private lastSpawnTime: number = 0;
  private spawnCounter = 0;

  /**
   * Try to spawn a powerup for a session
   */
  tick(session: GameSessionState): void {
    const now = Date.now();

    if (now - this.lastSpawnTime < SPAWN_INTERVAL) {
      return; // Not yet time to spawn
    }

    const state = session.getState();

    // Count current available powerups
    const currentCount = state.powerups.filter((p) => p.status === 'available').length;
    if (currentCount >= MAX_CONCURRENT_POWERUPS) {
      console.log(`[Powerup Spawner] Max concurrent powerups reached (${currentCount}/${MAX_CONCURRENT_POWERUPS})`);
      return; // At capacity
    }

    // Find safe spawn location
    const spawnPos = this.findSafeSpawnLocation(session);
    if (!spawnPos) {
      console.warn(`[Powerup Spawner] Could not find safe spawn location`);
      return;
    }

    // Randomly choose a powerup type
    const types: Array<'invincibility' | 'speed-boost' | 'double-xp'> = [
      'invincibility',
      'speed-boost',
      'double-xp',
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    // Create powerup
    const powerupId = `powerup-${this.spawnCounter++}-${now}`;
    const powerup = {
      id: powerupId,
      type,
      position: spawnPos,
      collisionRadius: 12,
      spawnTimeMs: now,
      status: 'available' as const,
    };

    state.powerups.push(powerup);
    this.lastSpawnTime = now;

    console.log(`[Powerup Spawner] Spawned ${type} powerup:`, {
      id: powerupId,
      position: spawnPos,
      totalPowerups: state.powerups.filter((p) => p.status === 'available').length,
    });
  }

  /**
   * Clean up expired powerups
   */
  cleanupExpiredPowerups(session: GameSessionState): void {
    const state = session.getState();
    const now = Date.now();

    const expiredPowerups = state.powerups.filter((p) => {
      const age = now - p.spawnTimeMs;
      return p.status === 'available' && age > POWERUP_LIFETIME;
    });

    if (expiredPowerups.length > 0) {
      expiredPowerups.forEach((p) => {
        p.status = 'despawning';
        console.log(`[Powerup Spawner] Powerup expired after ${Math.round((now - p.spawnTimeMs) / 1000)}s:`, p.id);
      });
    }

    // Remove despawned powerups after they've been despawning for 500ms
    state.powerups = state.powerups.filter((p) => {
      if (p.status === 'despawning') {
        const despawnAge = now - p.spawnTimeMs;
        return despawnAge <= POWERUP_LIFETIME + 500;
      }
      return true;
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

export const powerupSpawner = new PowerupSpawner();
