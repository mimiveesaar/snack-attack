import type { GamePowerUp } from '../../../shared/game';

export class PowerupRenderer {
  private container: SVGElement | null = null;
  private powerups: Map<string, SVGElement> = new Map();

  initialize(container: SVGElement): void {
    this.container = container;
    console.log('[PowerupRenderer] Initialized');
  }

  updateAll(powerups: GamePowerUp[]): void {
    if (!this.container) {
      console.warn('[PowerupRenderer] Container not initialized');
      return;
    }

    // Remove powerups that are no longer in the list
    for (const [id, el] of this.powerups.entries()) {
      const stillExists = powerups.some((p) => p.id === id && p.status !== 'collected' && p.status !== 'despawning');
      if (!stillExists) {
        const type = el.getAttribute('data-powerup');
        console.log(`[PowerupRenderer] Powerup removed from render: ${type} (${id})`);
        el.remove();
        this.powerups.delete(id);
      }
    }

    // Add or update powerups
    for (const powerup of powerups) {
      if (powerup.status === 'collected' || powerup.status === 'despawning') {
        continue; // Don't render collected or despawning powerups
      }

      let el = this.powerups.get(powerup.id);
      if (!el) {
        // New powerup - create and add it
        console.log(
          `[PowerupRenderer] Creating powerup: ${powerup.type} (${powerup.id}) at (${Math.round(powerup.position.x)}, ${Math.round(powerup.position.y)})`
        );
        el = this.createPowerupSVG(powerup);
        this.container.appendChild(el);
        this.powerups.set(powerup.id, el);
      }
      // Update position
      el.setAttribute('cx', String(powerup.position.x));
      el.setAttribute('cy', String(powerup.position.y));
    }
  }

  private createPowerupSVG(powerup: GamePowerUp): SVGElement {
    const color = 
      powerup.type === 'invincibility' ? '#FFD700' :  // Gold
      powerup.type === 'speed-boost' ? '#00BFFF' :     // Deep sky blue
      '#FF69B4'; // Hot pink for double-xp
    
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    icon.setAttribute('r', String(powerup.collisionRadius || 12));
    icon.setAttribute('fill', color);
    icon.setAttribute('stroke', '#222');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('opacity', '0.85');
    icon.setAttribute('cx', String(powerup.position.x));
    icon.setAttribute('cy', String(powerup.position.y));
    icon.setAttribute('data-powerup', powerup.type);
    return icon;
  }

  clear(): void {
    for (const el of this.powerups.values()) {
      el.remove();
    }
    this.powerups.clear();
    console.log('[PowerupRenderer] Cleared all powerups');
  }
}
