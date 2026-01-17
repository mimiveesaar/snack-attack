/**
 * Visual Entity Base Class - Represents any renderable game object
 *
 * Responsibilities:
 * - Position and state tracking
 * - Lifecycle management (spawn, active, despawn)
 * - Rendering
 */

export type EntityStatus = 'spawning' | 'alive' | 'despawning' | 'destroyed';

export interface Vec2D {
  x: number;
  y: number;
}

export class VisualEntity {
  protected id: string;
  protected position: Vec2D;
  protected velocity: Vec2D;
  protected status: EntityStatus = 'alive';
  protected element: SVGElement | HTMLElement | null = null;

  constructor(id: string, position: Vec2D = { x: 0, y: 0 }) {
    this.id = id;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
  }

  /**
   * Update entity position
   */
  setPosition(pos: Vec2D): void {
    this.position = pos;
    this.updateRender();
  }

  /**
   * Get current position
   */
  getPosition(): Vec2D {
    return this.position;
  }

  /**
   * Set velocity
   */
  setVelocity(vel: Vec2D): void {
    this.velocity = vel;
  }

  /**
   * Get velocity
   */
  getVelocity(): Vec2D {
    return this.velocity;
  }

  /**
   * Update entity state
   */
  setStatus(status: EntityStatus): void {
    this.status = status;
  }

  /**
   * Get entity status
   */
  getStatus(): EntityStatus {
    return this.status;
  }

  /**
   * Get entity ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get render element
   */
  getElement(): SVGElement | HTMLElement | null {
    return this.element;
  }

  /**
   * Update render (to be overridden by subclasses)
   */
  protected updateRender(): void {
    if (!this.element) return;

    // Default: update SVG position if it's an SVG element
    if (this.element instanceof SVGElement) {
      this.element.setAttribute('x', String(this.position.x));
      this.element.setAttribute('y', String(this.position.y));
    }
  }

  /**
   * Render the entity
   */
  render(container: SVGElement | HTMLElement): Promise<void> {
    // To be overridden by subclasses
    console.warn(`VisualEntity.render() not implemented for ${this.constructor.name}`);
    return Promise.resolve();
  }

  /**
   * Update entity (called each frame)
   */
  update(deltaMs: number): void {
    // To be overridden by subclasses
  }

  /**
   * Destroy entity and clean up
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.status = 'destroyed';
  }
}
