import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import './game-hud';
import './sidebar';

/**
 * GameScene - Main game canvas component
 *
 * Provides a fixed 600×600 game viewport with gradient background and border.
 * Hosts all game renderers and overlays.
 *
 * Layout:
 * - Game canvas: 600×600 with gradient background + black border
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
    // const devPreview =
    //   import.meta.env.DEV &&
    //   new URLSearchParams(window.location.search).get('devScene') === 'game';

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
          width: 800px;
          height: 600px;
          background: linear-gradient(180deg, #b4c3b5 0%, #49534a 100%);
          border: 3px solid black;
          overflow: hidden;
          flex-shrink: 0;
          font-family: "Jersey 10", system-ui, sans-serif;
        }

        #game-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
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
          z-index: 10;
        }

        #sidebar {
          width: 200px;
          height: 600px;
          background-color: #ADC8AF;
          border: 3px solid black;
          padding: 1rem;
          box-sizing: border-box;
          font-family: "Jersey 10", system-ui, sans-serif;
          overflow-y: auto;
        }
      </style>
      <div class="game-container">
        <!-- SVG canvas - renderers will mount here -->
        <svg id="game-canvas" >
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
