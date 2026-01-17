/**
 * Fish Entity - Represents a player or NPC fish
 *
 * Responsibilities:
 * - Render fish sprite with color
 * - Track size/scale
 * - Handle animation states (wiggle, direction)
 * - Apply growth phase visual changes
 */

import { VisualEntity, type Vec2D, type EntityStatus } from './visual-entity';

export type FishType = 'player' | 'npc-pink' | 'npc-grey' | 'npc-brown';

export class Fish extends VisualEntity {
  private type: FishType;
  private color: string;
  private size: number = 1.0; // visual size multiplier
  private collisionRadius: number = 12;
  private direction: number = 0; // radians for rotation
  private wigglePhase: number = 0;
  private xp: number = 0;
  private growthPhase: 1 | 2 | 3 = 1;

  constructor(
    id: string,
    type: FishType,
    position: Vec2D,
    color: string = '#000000',
    size: number = 1.0
  ) {
    super(id, position);
    this.type = type;
    this.color = color;
    this.size = size;
    this.updateCollisionRadius();
  }

  /**
   * Update collision radius based on size
   */
  private updateCollisionRadius(): void {
    const baseRadius = 12;
    this.collisionRadius = baseRadius * this.size;
  }

  /**
   * Set fish size (growth phase)
   */
  setSize(size: number): void {
    this.size = size;
    this.updateCollisionRadius();
    this.updateRender();
  }

  /**
   * Get collision radius
   */
  getCollisionRadius(): number {
    return this.collisionRadius;
  }

  /**
   * Set growth phase
   */
  setGrowthPhase(phase: 1 | 2 | 3): void {
    this.growthPhase = phase;
    const sizeMap: Record<1 | 2 | 3, number> = { 1: 1.0, 2: 1.5, 3: 2.0 };
    this.setSize(sizeMap[phase]);
  }

  /**
   * Update direction based on velocity
   */
  updateDirection(): void {
    if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
      this.direction = Math.atan2(this.velocity.y, this.velocity.x);
    }
  }

  /**
   * Update entity each frame
   */
  update(deltaMs: number): void {
    this.updateDirection();
    this.wigglePhase = (this.wigglePhase + deltaMs / 100) % (Math.PI * 2);
  }

  /**
   * Render fish as SVG
   */
  render(container: SVGElement): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', this.id);
    g.setAttribute('transform', `translate(${this.position.x}, ${this.position.y}) rotate(${(this.direction * 180) / Math.PI})`);

    // Fish body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    body.setAttribute('cx', '0');
    body.setAttribute('cy', '0');
    body.setAttribute('rx', String(this.collisionRadius * 0.8));
    body.setAttribute('ry', String(this.collisionRadius * 0.5));
    body.setAttribute('fill', this.color);
    body.setAttribute('stroke', '#000000');
    body.setAttribute('stroke-width', '1');

    // Fish eye
    const eye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eye.setAttribute('cx', String(this.collisionRadius * 0.4));
    eye.setAttribute('cy', String(-this.collisionRadius * 0.15));
    eye.setAttribute('r', String(this.collisionRadius * 0.15));
    eye.setAttribute('fill', '#ffffff');
    eye.setAttribute('stroke', '#000000');
    eye.setAttribute('stroke-width', '0.5');

    // Fish tail (simple triangle)
    const tail = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const tailX = -this.collisionRadius * 0.8;
    const tailPoints = `${tailX},0 ${tailX - this.collisionRadius * 0.4},${this.collisionRadius * 0.4} ${tailX - this.collisionRadius * 0.4},${-this.collisionRadius * 0.4}`;
    tail.setAttribute('points', tailPoints);
    tail.setAttribute('fill', this.color);
    tail.setAttribute('opacity', '0.8');

    g.appendChild(body);
    g.appendChild(eye);
    g.appendChild(tail);
    container.appendChild(g);

    this.element = g;
  }

  /**
   * Update render position
   */
  protected updateRender(): void {
    if (!this.element) return;
    this.element.setAttribute(
      'transform',
      `translate(${this.position.x}, ${this.position.y}) rotate(${(this.direction * 180) / Math.PI})`
    );
  }
}
