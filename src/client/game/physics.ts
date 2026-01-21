/**
 * Client Physics Module - Movement prediction, interpolation, and reconciliation
 *
 * Responsibilities:
 * - Apply movement input to player position
 * - Predict movement client-side
 * - Interpolate between server states
 * - Handle server reconciliation
 * - Manage velocity and acceleration
 */

import type { Vec2D } from '../../shared/game';

export interface EntityState {
  position: Vec2D;
  velocity: Vec2D;
  tick: number;
}

export class PhysicsManager {
  /**
   * Apply velocity to position based on time delta
   */
  applyVelocity(position: Vec2D, velocity: Vec2D, deltaTsMs: number): Vec2D {
    const deltaSeconds = deltaTsMs / 1000;
    return {
      x: position.x + velocity.x * deltaSeconds,
      y: position.y + velocity.y * deltaSeconds,
    };
  }

  /**
   * Calculate velocity from direction and speed
   */
  calculateVelocity(direction: { x: number; y: number }, speed: number): Vec2D {
    let magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (magnitude === 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: (direction.x / magnitude) * speed,
      y: (direction.y / magnitude) * speed,
    };
  }

  /**
   * Interpolate between two entity states using alpha (0-1)
   */
  interpolate(from: EntityState, to: EntityState, alpha: number): Vec2D {
    return {
      x: from.position.x + (to.position.x - from.position.x) * alpha,
      y: from.position.y + (to.position.y - from.position.y) * alpha,
    };
  }

  /**
   * Clamp position to game boundaries
   */
  clampToBoundary(position: Vec2D, radius: number, width: number = 500, height: number = 500): Vec2D {
    const boundary = 10; // buffer from edge

    return {
      x: Math.max(radius + boundary, Math.min(width - radius - boundary, position.x)),
      y: Math.max(radius + boundary, Math.min(height - radius - boundary, position.y)),
    };
  }

  /**
   * Calculate distance between two positions
   */
  distance(p1: Vec2D, p2: Vec2D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check circle collision
   */
  circleCollide(pos1: Vec2D, r1: number, pos2: Vec2D, r2: number): boolean {
    const dist = this.distance(pos1, pos2);
    return dist < r1 + r2;
  }
}

export const physicsManager = new PhysicsManager();
