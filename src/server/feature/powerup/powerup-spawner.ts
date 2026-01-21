import type { GameSessionState } from '../../game/state';
import { GAME_BOUNDARY} from '../../../shared/config';
import { POWERUP_SPAWN_CONFIG } from '../../config';

export class PowerupSpawner {
  private lastSpawnTime: number = 0;
  private spawnCounter = 0;

  tick(session: GameSessionState): void {

    // Clean up expired powerups first.
    this.cleanupExpiredPowerups(session);

    const now = Date.now();

    if (now - this.lastSpawnTime < POWERUP_SPAWN_CONFIG.spawnIntervalMs) {
      return; // Not yet time to spawn
    }

    const state = session.getState();

    // Count current available powerups
    const currentCount = state.powerups.filter((p) => p.status === 'available').length;
    if (currentCount >= POWERUP_SPAWN_CONFIG.maxConcurrentPowerups) {
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
      collisionRadius: POWERUP_SPAWN_CONFIG.collisionRadius,
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

  cleanupExpiredPowerups(session: GameSessionState): void {
    const state = session.getState();
    const now = Date.now();

    const expiredPowerups = state.powerups.filter((p) => {
      const age = now - p.spawnTimeMs;
      return p.status === 'available' && age > POWERUP_SPAWN_CONFIG.powerupLifetimeMs;
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
        return despawnAge <= POWERUP_SPAWN_CONFIG.powerupLifetimeMs + POWERUP_SPAWN_CONFIG.despawnGraceMs;
      }
      return true;
    });
  }

  private findSafeSpawnLocation(session: GameSessionState): { x: number; y: number } | null {
    const state = session.getState();
    const attempts = 10;

    for (let i = 0; i < attempts; i++) {
      const x = GAME_BOUNDARY.buffer + Math.random() * (GAME_BOUNDARY.width - 2 * GAME_BOUNDARY.buffer);
      const y = GAME_BOUNDARY.buffer + Math.random() * (GAME_BOUNDARY.height - 2 * GAME_BOUNDARY.buffer);

      // Check distance to all players
      let safe = true;
      for (const player of state.players) {
        const dx = x - player.position.x;
        const dy = y - player.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < POWERUP_SPAWN_CONFIG.spawnDistance) {
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