/**
 * Visual Entity Base Class - Represents any renderable game object
 *
 * Responsibilities:
 * - Position and state tracking
 * - Lifecycle management (spawn, active, despawn)
 * - Rendering
 */

import type { Vec2D } from '../../../shared/game';

export type EntityStatus = 'spawning' | 'alive' | 'despawning' | 'destroyed';

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

  setPosition(pos: Vec2D): void {
    this.position = pos;
    this.updateRender();
  }

  getPosition(): Vec2D {
    return this.position;
  }

  setVelocity(vel: Vec2D): void {
    this.velocity = vel;
  }

  getVelocity(): Vec2D {
    return this.velocity;
  }

  setStatus(status: EntityStatus): void {
    this.status = status;
  }

  getStatus(): EntityStatus {
    return this.status;
  }

  getId(): string {
    return this.id;
  }

  getElement(): SVGElement | HTMLElement | null {
    return this.element;
  }

  protected updateRender(): void {
    if (!this.element) return;

    // Default: update SVG position if it's an SVG element
    if (this.element instanceof SVGElement) {
      this.element.setAttribute('x', String(this.position.x));
      this.element.setAttribute('y', String(this.position.y));
    }
  }

  render(container: SVGElement | HTMLElement): Promise<void> {
    // To be overridden by subclasses
    console.warn(`VisualEntity.render() not implemented for ${this.constructor.name}`);
    return Promise.resolve();
  }

  update(deltaMs: number): void {
    // To be overridden by subclasses
  }

  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.status = 'destroyed';
  }
}