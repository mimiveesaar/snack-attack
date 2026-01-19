import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bubbleAssets, rockAssets, seaweedAssets, terrainDirtAssets, terrainSandAssets } from './utils/game-assets';
import { generateLayout } from './utils/layout-generator';
import { normalizeSeed } from '@client/utils/seed';
import '../../styles/game-view.css';
import './terrain-layer';
import './rock';
import './seaweed';
import './bubble';

@customElement('game-view')
export class GameView extends LitElement {
  @property({ type: String }) seed = '';
  @state() private layout = generateLayout(normalizeSeed(this.seed));

  createRenderRoot() {
    return this;
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('seed')) {
      this.layout = generateLayout(normalizeSeed(this.seed));
    }
  }

  render() {
    const { terrain, rocks, seaweed, bubbles } = this.layout;
    return html`
      <section class="game-shell" aria-label="Game View">
        <div class="game-stage">
          <terrain-layer
            .dirtSrc=${terrainDirtAssets[terrain.dirtIndex]}
            .sandSrc=${terrainSandAssets[terrain.sandIndex]}
          ></terrain-layer>

          ${rocks.map(
            (rock) => html`
              <game-rock
                style="left: ${rock.position.x}px; bottom: 0px;"
                .src=${rockAssets[rock.variantIndex]}
                .size=${rock.size}
              ></game-rock>
            `,
          )}

          ${seaweed.map(
            (item) => html`
              <game-seaweed
                style="left: ${item.position.x}px; bottom: 0px;"
                .src=${seaweedAssets[item.variantIndex]}
                .size=${item.size}
              ></game-seaweed>
            `,
          )}

          ${bubbles.map(
            (bubble) => html`
              <game-bubble
                style="left: ${bubble.position.x}px; top: ${bubble.position.y}px;"
                .src=${bubbleAssets[bubble.variantIndex]}
                .size=${bubble.size}
                .durationMs=${bubble.durationMs}
                .delayMs=${bubble.delayMs}
                .startYOffset=${bubble.startYOffset}
                .endYOffset=${bubble.endYOffset}
              ></game-bubble>
            `,
          )}

          <div class="game-hud">
            <span class="game-seed">Seed</span>
            <span>${this.layout.seed}</span>
          </div>
        </div>
      </section>
    `;
  }
}
