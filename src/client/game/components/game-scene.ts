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
 *
 * Note: Using createRenderRoot() to render directly to light DOM so GameManager
 * can access #game-canvas, #game-overlay, and #sidebar elements via document.getElementById()
 */

@customElement('game-scene')
export class GameScene extends LitElement {
  // Render to light DOM instead of shadow DOM so GameManager can access elements
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        game-scene {
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
          width: 1000px;
          height: 700px;
          background: linear-gradient(180deg, #b4c3b5 0%, #49534a 100%);
          border: 3px solid black;
          overflow: hidden;
          flex-shrink: 0;
        }

        #game-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        #game-overlay {
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

        #sidebar {
          width: 200px;
          height: 500px;
          background-color: #f0f0f0;
          border: 3px solid black;
          border-radius: 8px;
          padding: 1rem;
          box-sizing: border-box;
          font-family: 'Courier New', monospace;
          overflow-y: auto;
        }
      </style>
      <div class="game-container">
        <!-- SVG canvas - renderers will mount here -->
        <svg id="game-canvas" width="500" height="500" viewBox="0 0 500 500">
          <!-- Player renderer will render here -->
          <!-- Hostile renderer will render here -->
          <!-- Powerup renderer will render here -->
          <!-- Decal renderer will render here -->
        </svg>

        <!-- HUD overlay: timer, pause button, end screen -->
        <div id="game-overlay">
          <!-- game-hud component will mount here -->
        </div>
      </div>

      <!-- Sidebar: score, Fish-O-Meter, leaderboard, controls -->
      <div id="sidebar">
        <!-- leaderboard component will mount here -->
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
