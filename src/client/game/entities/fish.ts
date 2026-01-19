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
    // NPC colors (lowercase for consistency)
    '#ff69b4': 'fish_pink',      // Hot pink
    '#FF69B4': 'fish_pink',      // Hot pink (uppercase)
    '#C985D0': 'fish_pink',      // Light purple/pink
    '#808080': 'fish_grey',      // Grey
    '#A9A9A9': 'fish_grey',      // Dark grey
    '#8b4513': 'fish_brown',     // Brown (lowercase)
    '#8B4513': 'fish_brown',     // Brown (uppercase)
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
  private lastFacingDirection: number = 1; // 1 for right, -1 for left
  private haloElement: SVGCircleElement | null = null;
  private haloColor: string | null = null;
  private haloGradientId: string | null = null;
  private haloFilterId: string | null = null;
  
  // Smooth movement properties
  private targetPosition: Vec2D;
  private startPosition: Vec2D;
  private animationDuration: number = 150; // milliseconds for smooth movement (1.5x server update rate)
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
   * Set powerup halo around the fish
   * @param powerupType - The type of powerup ('speed-boost', 'double-xp', 'invincibility') or null to remove halo
   */
  setPowerupHalo(powerupType: string | null): void {
    const haloColorMap: Record<string, string> = {
      'speed-boost': '#FF0000',      // Red
      'double-xp': '#FFFF00',        // Yellow
      'invincibility': '#0000FF'     // Blue
    };

    if (powerupType && haloColorMap[powerupType]) {
      this.haloColor = haloColorMap[powerupType];
      this.createOrUpdateHalo();
    } else {
      this.haloColor = null;
      this.removeHalo();
    }
  }

  /**
   * Create or update the halo element
   */
  private createOrUpdateHalo(): void {
    if (!this.element || !this.haloColor) return;

    const svgRoot = (this.element as SVGGraphicsElement | null)?.ownerSVGElement;
    if (!svgRoot) return;

    // Remove existing halo if present
    this.removeHalo();

    // Ensure <defs> exists
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }

    // Create unique ids for gradient and blur filter
    this.haloGradientId = `${this.id}-halo-gradient`;
    this.haloFilterId = `${this.id}-halo-blur`;

    // Radial gradient for glowing halo
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    gradient.setAttribute('id', this.haloGradientId);
    gradient.setAttribute('fx', '50%');
    gradient.setAttribute('fy', '50%');
    gradient.setAttribute('r', '50%');
    gradient.innerHTML = `
      <stop offset="0%" stop-color="${this.haloColor}" stop-opacity="0.35" />
      <stop offset="50%" stop-color="${this.haloColor}" stop-opacity="0.2" />
      <stop offset="100%" stop-color="${this.haloColor}" stop-opacity="0" />
    `;
    defs.appendChild(gradient);

    // Blur filter to soften the glow
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', this.haloFilterId);
    filter.innerHTML = '<feGaussianBlur in="SourceGraphic" stdDeviation="6" />';
    defs.appendChild(filter);

    // Create new halo circle using gradient fill and blur filter
    this.haloElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.haloElement.setAttribute('cx', '0');
    this.haloElement.setAttribute('cy', '0');
    this.haloElement.setAttribute('r', String((this.collisionRadius + 20) / this.size));
    this.haloElement.setAttribute('fill', `url(#${this.haloGradientId})`);
    this.haloElement.setAttribute('filter', `url(#${this.haloFilterId})`);
    this.haloElement.setAttribute('class', 'powerup-halo');

    // Insert halo at the beginning so it appears behind the fish
    this.element.insertBefore(this.haloElement, this.element.firstChild);
  }

  /**
   * Remove the halo element
   */
  private removeHalo(): void {
    if (this.haloElement) {
      this.haloElement.remove();
      this.haloElement = null;
    }
    const svgRoot = (this.element as SVGGraphicsElement | null)?.ownerSVGElement;
    if (svgRoot) {
      if (this.haloGradientId) {
        const grad = svgRoot.querySelector(`#${this.haloGradientId}`);
        grad?.remove();
      }
      if (this.haloFilterId) {
        const filt = svgRoot.querySelector(`#${this.haloFilterId}`);
        filt?.remove();
      }
    }
    this.haloGradientId = null;
    this.haloFilterId = null;
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
   * Ease out cubic function for smoother movement
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
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

      // Apply easing for smoother motion
      const easedProgress = this.easeOutCubic(this.animationProgress);

      // Interpolate from start to target with easing
      this.position.x = this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * easedProgress;
      this.position.y = this.startPosition.y + (this.targetPosition.y - this.startPosition.y) * easedProgress;

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
      
      // Add collision radius visualization circle (drawn first, so it appears behind the fish)
      const collisionCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      collisionCircle.setAttribute('cx', '0');
      collisionCircle.setAttribute('cy', '0');
      collisionCircle.setAttribute('r', String(this.collisionRadius / this.size)); // Adjust for scale
      collisionCircle.setAttribute('fill', 'none');
      collisionCircle.setAttribute('stroke', 'rgba(255, 0, 0, 0.3)');
      collisionCircle.setAttribute('stroke-width', String(2 / this.size)); // Adjust stroke width for scale
      collisionCircle.setAttribute('class', 'collision-radius');
      collisionCircle.setAttribute('vector-effect', 'non-scaling-stroke'); // Keep stroke consistent
      g.appendChild(collisionCircle);
      

      // Clone the SVG content into the group (drawn after circle, appears on top)
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
      
      // Now that it's in the DOM, center the SVG content
      const svgContent = content ? g.querySelector('g:not(.collision-radius)') : g;
      if (svgContent && svgContent !== g) {
        try {
          const bbox = (svgContent as SVGGraphicsElement).getBBox();
          // Translate the content so its center is at (0, 0)
          const centerX = bbox.x + bbox.width / 2;
          const centerY = bbox.y + bbox.height / 2;
          (svgContent as SVGGElement).setAttribute('transform', `translate(${-centerX}, ${-centerY})`);
          console.log(`Fish.render(): Centered SVG content at (${-centerX}, ${-centerY}), bbox:`, bbox);
        } catch (e) {
          console.warn('Could not get bbox for centering:', e);
        }
      }
    
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
   * Update render position and orientation
   */
  protected updateRender(): void {
    if (!this.element) return;
    
    // Update last facing direction only when actually moving horizontally
    if (Math.abs(this.velocity.x) > 0.01) {
      this.lastFacingDirection = this.velocity.x < 0 ? -1 : 1;
    }
    
    // Use lastFacingDirection which persists even when velocity is 0
    const facingLeft = this.lastFacingDirection === -1;
    const scaleX = facingLeft ? -1 : 1;
    
    // Calculate rotation angle for vertical movement (limited to avoid extreme angles)
    let rotationAngle = 0;
    if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.y) > 0.01) {
      // Calculate angle but limit it to reasonable swimming angles
      const rawAngle = Math.atan2(this.velocity.y, Math.abs(this.velocity.x));
      rotationAngle = Math.max(-30, Math.min(30, (rawAngle * 180) / Math.PI)); // Limit to ±30 degrees
    }
    
    this.element.setAttribute(
      'transform',
      `translate(${this.position.x}, ${this.position.y}) scale(${scaleX * this.size}, ${this.size}) rotate(${rotationAngle})`
    );
  }
}

