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
    // Player colors
    '#228B22': 'fish_green',     // Forest green
    '#FFA500': 'fish_orange',    // Orange/Yellow
    '#4169E1': 'fish_blue',      // Royal blue
    '#FF6347': 'fish_red',       // Tomato red
    // NPC colors
    '#FF69B4': 'fish_pink',      // Hot pink
    '#C985D0': 'fish_pink',      // Light purple/pink
    '#808080': 'fish_grey',      // Grey
    '#A9A9A9': 'fish_grey',      // Dark grey
    '#8B4513': 'fish_brown',     // Brown
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
  
  // Smooth movement properties
  private targetPosition: Vec2D;
  private startPosition: Vec2D;
  private animationDuration: number = 100; // milliseconds for smooth movement
  private animationProgress: number = 1; // 0 to 1, where 1 means arrived

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
    this.targetPosition = { ...position };
    this.startPosition = { ...position };
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
   * Set target position for smooth animation
   * Override parent setPosition to enable smooth movement
   */
  setPosition(pos: Vec2D): void {
    this.startPosition = { ...this.position };
    this.targetPosition = { ...pos };
    this.animationProgress = 0; // Start animation
  }

  /**
   * Get current interpolated position
   */
  getPosition(): Vec2D {
    return this.position;
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

    // Smooth animation towards target position
    if (this.animationProgress < 1) {
      this.animationProgress = Math.min(1, this.animationProgress + deltaMs / this.animationDuration);

      // Linear interpolation from start to target
      this.position.x = this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * this.animationProgress;
      this.position.y = this.startPosition.y + (this.targetPosition.y - this.startPosition.y) * this.animationProgress;

      this.updateRender();
    }
  }

  /**
   * Render fish using SVG asset
   */
  async render(container: SVGElement): Promise<void> {

    console.log(`Fish.render() START for ${this.id}`);
    console.log('Container:', container);
    console.log('Container is SVGElement?', container instanceof SVGElement);
    console.log('Container in DOM?', document.body.contains(container));

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    const assetName = getfishAssetName(this.color);
    const assetPath = `/assets/Vector/${assetName}.svg`;

    console.log(`Fish.render(): Loading ${assetName} from ${assetPath}`);

    try {
      // Fetch the SVG
      const response = await fetch(assetPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${assetPath}: ${response.status}`);
      }
      const svgText = await response.text();
      console.log(`Fish.render(): Loaded ${assetName}, text length: ${svgText.length}`);
      console.log(`Fish.render(): SVG text preview:`, svgText.substring(0, 200));
      
      // Parse SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement as unknown as SVGSVGElement;

      console.log('Parsed SVG element:', svgElement);
      console.log('SVG element tagName:', svgElement.tagName);

      // Create a group to hold the SVG and apply transformations
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', this.id);
      g.setAttribute('transform', `translate(${this.position.x}, ${this.position.y}) rotate(${(this.direction * 180) / Math.PI}) scale(${this.size})`);

      console.log('Created group element:', g);
      

      // Clone the SVG content into the group
      const content = svgElement.querySelector('g');
      console.log('Found content <g>?', content);

      if (content) {
        const clone = content.cloneNode(true) as SVGGElement;
        g.appendChild(clone);
        console.log(`Fish.render(): Cloned SVG content for ${this.id}, clone has ${clone.childNodes.length} children`);
      } else {
        console.warn(`Fish.render(): No <g> element found in ${assetName}`);
        Array.from(svgElement.children).forEach(child => {
        g.appendChild(child.cloneNode(true));
      });
      console.log(`Fish.render(): Cloned ${svgElement.children.length} direct children`);
      }

      console.log('About to append to container, g has children?', g.childNodes.length);
    container.appendChild(g);
    console.log(`Fish.render(): SUCCESS - Appended fish ${this.id} to container`);
    console.log('Element now in DOM?', document.body.contains(g));
    
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

