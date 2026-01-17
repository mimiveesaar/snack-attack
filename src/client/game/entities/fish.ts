/**
 * Fish Entity - Represents a player or NPC fish
 *
 * Responsibilities:
 * - Render fish sprite with color using SVG assets
 * - Track size/scale
 * - Handle animation states (wiggle, direction)
 * - Apply growth phase visual changes
 */

import { VisualEntity, type Vec2D, type EntityStatus } from './visual-entity';

export type FishType = 'player' | 'npc-pink' | 'npc-grey' | 'npc-brown';

/**
 * Map color hex codes to fish SVG asset names
 */
function getfishAssetName(color: string): string {
  const colorMap: Record<string, string> = {
    '#FF69B4': 'fish_pink',      // Hot pink
    '#C985D0': 'fish_pink',      // Light purple/pink
    '#808080': 'fish_grey',      // Grey
    '#A9A9A9': 'fish_grey',      // Dark grey
    '#8B4513': 'fish_brown',     // Brown
    '#FF6347': 'fish_red',       // Tomato red
    '#FFA500': 'fish_orange',    // Orange
    '#4169E1': 'fish_blue',      // Royal blue
    '#228B22': 'fish_green',     // Forest green
  };

  // Check for exact match first
  if (colorMap[color]) {
    return colorMap[color];
  }

  // Default based on color brightness
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness > 180) return 'fish_orange';
  if (brightness < 80) return 'fish_grey';
  return 'fish_pink';
}

export class Fish extends VisualEntity {
  private type: FishType;
  private color: string;
  private size: number = 1.0; // visual size multiplier
  private collisionRadius: number = 12;
  private direction: number = 0; // radians for rotation
  private wigglePhase: number = 0;
  private xp: number = 0;
  private growthPhase: 1 | 2 | 3 = 1;
  private svgAsset: SVGSVGElement | null = null;

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
   * Render fish using SVG asset
   */
  async render(container: SVGElement): Promise<void> {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    const assetName = getfishAssetName(this.color);
    const assetPath = `/assets/Vector/${assetName}.svg`;

    try {
      // Fetch the SVG
      const response = await fetch(assetPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${assetPath}: ${response.status}`);
      }
      const svgText = await response.text();
      
      // Parse SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement as unknown as SVGSVGElement;

      // Create a group to hold the SVG and apply transformations
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', this.id);
      g.setAttribute('transform', `translate(${this.position.x}, ${this.position.y}) rotate(${(this.direction * 180) / Math.PI}) scale(${this.size})`);

      // Clone the SVG content into the group
      const content = svgElement.querySelector('g');
      if (content) {
        const clone = content.cloneNode(true) as SVGGElement;
        g.appendChild(clone);
      }

      container.appendChild(g);
      this.element = g;
      this.svgAsset = svgElement;
    } catch (error) {
      console.error(`Failed to load fish asset ${assetName} from ${assetPath}:`, error);
      // Fallback to simple rendering
      this.renderFallback(container);
    }
  }

  /**
   * Fallback rendering if SVG asset fails to load
   */
  private renderFallback(container: SVGElement): void {
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
      `translate(${this.position.x}, ${this.position.y}) rotate(${(this.direction * 180) / Math.PI}) scale(${this.size})`
    );
  }
}

