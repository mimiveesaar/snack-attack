/**
 * Player Renderer Manager - Manages rendering of all player fish
 *
 * Responsibilities:
 * - Create and maintain player fish entities
 * - Update player positions from server state
 * - Apply client-side prediction for self player
 * - Render all players in game world
 */

import { Fish, type FishType } from '../entities/fish';
import type { Vec2D } from '../physics';

export interface PlayerRenderState {
  playerId: string;
  position: Vec2D;
  velocity: Vec2D;
  color: string;
  nicknameDisplay: string;
  xp: number;
  growthPhase: 1 | 2 | 3;
  visualSize: number;
  status: 'alive' | 'respawning' | 'spectating';
}

export class PlayerRenderer {
  private container: SVGElement | null = null;
  private players: Map<string, Fish> = new Map();
  private selfPlayerId: string | null = null;

  /**
   * Initialize renderer with container
   */
  initialize(container: SVGElement, selfPlayerId: string): void {
    this.container = container;
    this.selfPlayerId = selfPlayerId;
    console.log(`PlayerRenderer: Initialized for player ${selfPlayerId}`);
    console.log(`PlayerRenderer: Container is SVGElement?`, container instanceof SVGElement);
    console.log(`PlayerRenderer: Container tag:`, container.tagName);
    console.log(`PlayerRenderer: Container in DOM?`, document.body.contains(container));
  }

  /**
   * Update or create player
   */
  updatePlayer(state: PlayerRenderState): void {
    if (!this.container) {
      console.warn('PlayerRenderer.updatePlayer: Container is null');
      return;
    }

    let fish = this.players.get(state.playerId);

    if (!fish) {
      // Create new player fish
      console.log(`PlayerRenderer: Creating new fish for ${state.playerId}`);
      const fishType: FishType = 'player';
      fish = new Fish(state.playerId, fishType, state.position, state.color, state.visualSize);
      // Render asynchronously
      fish.render(this.container).catch((error) => {
        console.error(`Failed to render fish ${state.playerId}:`, error);
      });
      this.players.set(state.playerId, fish);
      console.log(`PlayerRenderer: Fish created and render called for ${state.playerId}`);
    }

    // Update fish state
    fish.setPosition(state.position);
    fish.setVelocity(state.velocity);
    fish.setGrowthPhase(state.growthPhase);

    // Handle respawn state
    if (state.status === 'respawning') {
      if (fish.getElement()) {
        fish.getElement()!.setAttribute('opacity', '0.5');
      }
    } else {
      if (fish.getElement()) {
        fish.getElement()!.setAttribute('opacity', '1');
      }
    }
  }

  /**
   * Remove player
   */
  removePlayer(playerId: string): void {
    const fish = this.players.get(playerId);
    if (fish) {
      fish.destroy();
      this.players.delete(playerId);
    }
  }

  /**
   * Update all players
   */
  updateAll(states: PlayerRenderState[]): void {
    if (!this.container) {
      console.warn('PlayerRenderer: Container not found');
      return;
    }

    // Update existing players
    states.forEach((state) => {
      this.updatePlayer(state);
    });

    // Remove players no longer in state
    const stateIds = new Set(states.map((s) => s.playerId));
    const toRemove: string[] = [];
    this.players.forEach((_, playerId) => {
      if (!stateIds.has(playerId)) {
        toRemove.push(playerId);
      }
    });
    toRemove.forEach((id) => this.removePlayer(id));
  }

  /**
   * Update all players per frame
   */
  updateFrame(deltaMs: number): void {
    this.players.forEach((fish) => {
      fish.update(deltaMs);
    });
  }

  /**
   * Clear all players
   */
  clear(): void {
    this.players.forEach((fish) => fish.destroy());
    this.players.clear();
  }

  /**
   * Destroy renderer
   */
  destroy(): void {
    this.clear();
    this.container = null;
  }
}
