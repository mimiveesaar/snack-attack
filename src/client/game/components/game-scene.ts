import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * GameScene - Main game canvas component
 *
 * Provides a fixed 500×500 game viewport with gradient background and border.
 * Hosts all game renderers and overlays.
 *
 * Layout:
 * - Game canvas: 500×500 with gradient background + black border
 * - HUD: Timer, pause button, end screen overlay (positioned absolute)
 * - Sidebar: Real-time score, leaderboard, controls (positioned absolute)
 * - Decorations: Sand, rocks, seaweed (rendered via decal-renderer)
 */

@customElement('game-scene')
export class GameScene extends LitElement {
  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 100vh;
      background-color: #8d9e8e;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .game-container {
      position: relative;
      width: 500px;
      height: 500px;
      background: linear-gradient(180deg, #b4c3b5 0%, #49534a 100%);
      border: 3px solid black;
      overflow: hidden;
      flex-shrink: 0;
    }

    .game-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .sidebar-placeholder {
      position: absolute;
      right: -150px;
      top: 50%;
      transform: translateY(-50%);
      width: 140px;
      height: 400px;
      background-color: #adc8af;
      border: 3px solid black;
      border-radius: 20px;
      padding: 1rem;
      box-sizing: border-box;
      font-family: 'Courier New', monospace;
    }
  `;

  render() {
    return html`
      <div class="game-container">
        <!-- Game canvas - renderers will mount here -->
        <div class="game-canvas" id="game-canvas">
          <!-- Player renderer will render here -->
          <!-- Hostile renderer will render here -->
          <!-- Powerup renderer will render here -->
          <!-- Decal renderer will render here -->
        </div>

        <!-- HUD overlay: timer, pause button, end screen -->
        <div class="game-overlay" id="game-overlay">
          <!-- game-hud component will mount here -->
        </div>
      </div>

      <!-- Sidebar: score, Fish-O-Meter, leaderboard, controls -->
      <div class="sidebar-placeholder" id="sidebar">
        <!-- sidebar component will mount here -->
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('GameScene mounted');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'game-scene': GameScene;
  }
}
