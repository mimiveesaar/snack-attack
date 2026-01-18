/**
 * Collision Detection Module - Server-side collision resolution
 *
 * Responsibilities:
 * - Check if player can eat NPC (XP-based)
 * - Apply grace period logic
 * - Transfer XP and update scores
 * - Check boundary collisions
 * - Resolve power-up collisions
 * - Return collision events for broadcasting
 */

import type { GameSessionState } from './state';

export interface CollisionEvent {
  type: 'fish-eaten' | 'powerup-collected' | 'boundary-hit';
  tick: number;
  data: Record<string, any>;
}

export class CollisionDetector {
  private readonly GAME_WIDTH = 800;
  private readonly GAME_HEIGHT = 800;
  private readonly BOUNDARY_BUFFER = 10;

  /**
   * Check if player can eat an NPC (XP-based)
   * Rule: playerRadius >= npcRadius
   */
  canEat(playerRadius: number, npcRadius: number): boolean {
    return playerRadius >= npcRadius;
  }

  /**
   * Check if player is in grace period (recently respawned)
   */
  isInGracePeriod(now: number, graceEndTimeMs: number | null): boolean {
    if (!graceEndTimeMs) return false;
    return now < graceEndTimeMs;
  }

  /**
   * Check if two entities collide (circle collision)
   */
  circleCollide(
    pos1: { x: number; y: number },
    r1: number,
    pos2: { x: number; y: number },
    r2: number
  ): boolean {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  }

  /**
   * Check boundary collision
   */
  isBoundaryCollision(x: number, y: number, radius: number): boolean {
    return (
      x - radius < this.BOUNDARY_BUFFER ||
      x + radius > this.GAME_WIDTH - this.BOUNDARY_BUFFER ||
      y - radius < this.BOUNDARY_BUFFER ||
      y + radius > this.GAME_HEIGHT - this.BOUNDARY_BUFFER
    );
  }

  /**
   * Clamp position to boundary
   */
  clampToBoundary(x: number, y: number, radius: number): { x: number; y: number } {
    return {
      x: Math.max(radius + this.BOUNDARY_BUFFER, Math.min(this.GAME_WIDTH - radius - this.BOUNDARY_BUFFER, x)),
      y: Math.max(radius + this.BOUNDARY_BUFFER, Math.min(this.GAME_HEIGHT - radius - this.BOUNDARY_BUFFER, y)),
    };
  }

  /**
   * Process eating collisions for all players vs NPCs
   * Resolved in joinOrder to ensure deterministic ordering
   */
  processEatingCollisions(session: GameSessionState, now: number): CollisionEvent[] {
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
        if (this.circleCollide(player.position, player.collisionRadius, npc.position, npc.collisionRadius)) {
          // Check if player can eat this NPC
          if (this.canEat(player.collisionRadius, npc.collisionRadius)) {
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

    // Update leaderboard after eating
    session.updateLeaderboard();

    return events;
  }

  /**
   * Process NPCs eating players (when NPC is bigger)
   */
  processNPCsEatingPlayers(session: GameSessionState, now: number): CollisionEvent[] {
    const events: CollisionEvent[] = [];
    const state = session.getState();

    // Track players to respawn
    const playersToRespawn: string[] = [];

    // Check each NPC against each player
    for (const npc of state.npcs) {
      for (const player of state.players) {
        if (player.status !== 'alive') continue;
        if (session.isPlayerInGrace(player.id)) continue; // Skip if in grace period

        // Check collision
        if (this.circleCollide(npc.position, npc.collisionRadius, player.position, player.collisionRadius)) {
          // Check if NPC can eat this player (NPC radius >= player radius)
          if (this.canEat(npc.collisionRadius, player.collisionRadius)) {
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

    // Update leaderboard after players were eaten
    if (playersToRespawn.length > 0) {
      session.updateLeaderboard();
    }

    return events;
  }

  /**
   * Process boundary collisions (clamp player positions)
   */
  processBoundaryCollisions(session: GameSessionState): void {
    const state = session.getState();

    for (const player of state.players) {
      if (this.isBoundaryCollision(player.position.x, player.position.y, player.collisionRadius)) {
        const clamped = this.clampToBoundary(player.position.x, player.position.y, player.collisionRadius);
        player.position = clamped;
      }
    }

    for (const npc of state.npcs) {
      if (this.isBoundaryCollision(npc.position.x, npc.position.y, npc.collisionRadius)) {
        const clamped = this.clampToBoundary(npc.position.x, npc.position.y, npc.collisionRadius);
        npc.position = clamped;

        // Reverse velocity to bounce
        npc.velocity.x *= -1;
        npc.velocity.y *= -1;
      }
    }
  }
}

export const collisionDetector = new CollisionDetector();
