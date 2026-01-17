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

export interface CollisionEvent {
  type: 'fish-eaten' | 'powerup-collected' | 'boundary-hit';
  tick: number;
  data: Record<string, any>;
}

export class CollisionDetector {
  private readonly GAME_WIDTH = 500;
  private readonly GAME_HEIGHT = 500;
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
}

export const collisionDetector = new CollisionDetector();
