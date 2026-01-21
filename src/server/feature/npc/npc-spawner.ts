import type { GameSessionState } from '../../game/state';
import { NPC_SPAWN_CONFIG } from '../../config';

type NPCType = keyof typeof NPC_SPAWN_CONFIG.types;

export class NPCSpawner {
  private lastSpawnTime: Record<NPCType, number> = {
    pink: 0,
    grey: 0,
    brown: 0,
  };

  private spawnCounter = 0;

  public tick(session: GameSessionState): void {
    const now = Date.now();

    this.trySpawn(session, 'pink', now);
    this.trySpawn(session, 'grey', now);
    this.trySpawn(session, 'brown', now);
  }

  private trySpawn(session: GameSessionState, type: NPCType, now: number): void {
    const lastSpawn = this.lastSpawnTime[type];
    const interval = NPC_SPAWN_CONFIG.types[type].intervalMs;

    if (now - lastSpawn < interval) {
      return; 
    }

    const state = session.getState();

    // Check if we are at max concurrent NPCs of this type
    const currentCount = state.npcs.filter((n: { type: string; }) => n.type === type).length;
    if (currentCount >= NPC_SPAWN_CONFIG.types[type].maxConcurrent) {
      return; 
    }

    const typeConfig = NPC_SPAWN_CONFIG.types[type];

    if (typeConfig.swarm) {
      this.spawnSwarm(session, type, now);
    } else {
      this.spawnSingleNPC(session, type, now);
    }

    this.lastSpawnTime[type] = now;
  }

  private spawnSwarm(session: GameSessionState, type: NPCType, now: number): void {
    const state = session.getState();
    const { swarm, maxConcurrent, xp, collisionRadius, visualSize } = NPC_SPAWN_CONFIG.types[type];
    const { boundaryBuffer, bounds } = NPC_SPAWN_CONFIG.spawn;

    if (!swarm) {
      return;
    }
    
    // Find safe spawn location for swarm center
    const centerPos = this.findSafeSpawnLocation(session);
    if (!centerPos) {
      return; // Can't find safe location
    }

    const currentCount = state.npcs.filter((n: { type: string; }) => n.type === type).length;
    const spawnCount = Math.min(swarm.size, maxConcurrent - currentCount);

    if (spawnCount <= 0) {
      return;
    }

    for (let i = 0; i < spawnCount; i++) {
      const angle = (Math.PI * 2 * i) / spawnCount;
      const distance = Math.random() * swarm.radius;
      const x = Math.max(boundaryBuffer, Math.min(bounds.width - boundaryBuffer, 
        centerPos.x + Math.cos(angle) * distance));
      const y = Math.max(boundaryBuffer, Math.min(bounds.height - boundaryBuffer, 
        centerPos.y + Math.sin(angle) * distance));

      const npcId = `npc-${this.spawnCounter++}-${Date.now()}-${i}`;
      
      state.npcs.push({
        id: npcId,
        type,
        xp,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        collisionRadius,
        visualSize,
        status: 'alive',
        spawnTimeMs: now,
      });
    }
  }

  private spawnSingleNPC(session: GameSessionState, type: NPCType, now: number): void {
    const state = session.getState();
    const { xp, collisionRadius, visualSize } = NPC_SPAWN_CONFIG.types[type];
    
    // Find safe spawn location
    const spawnPos = this.findSafeSpawnLocation(session);
    if (!spawnPos) {
      return; // Can't find safe location
    }

    // Create NPC
    const npcId = `npc-${this.spawnCounter++}-${Date.now()}`;
    state.npcs.push({
      id: npcId,
      type,
      xp,
      position: spawnPos,
      velocity: { x: 0, y: 0 },
      collisionRadius,
      visualSize,
      status: 'alive',
      spawnTimeMs: now,
    });
  }

  private findSafeSpawnLocation(session: GameSessionState): { x: number; y: number } | null {
    const state = session.getState();
    const { maxAttempts, boundaryBuffer, bounds, minDistanceFromPlayers } = NPC_SPAWN_CONFIG.spawn;

    for (let i = 0; i < maxAttempts; i++) {
      const x = boundaryBuffer + Math.random() * (bounds.width - 2 * boundaryBuffer);
      const y = boundaryBuffer + Math.random() * (bounds.height - 2 * boundaryBuffer);

      // Check distance to all players
      let safe = true;
      for (const player of state.players) {
        const dx = x - player.position.x;
        const dy = y - player.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistanceFromPlayers) {
          safe = false;
          break;
        }
      }

      if (safe) {
        return { x, y };
      }
    }

    return null; 
  }
}