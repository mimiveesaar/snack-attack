import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bubbleAssets, defaultFishAsset, rockAssets, seaweedAssets, terrainDirtAssets, terrainSandAssets } from '@client/feature/assets/game-assets';
import { GameLoop } from '@client/feature/engine/game-loop';
import { Fish } from '@client/feature/fish/fish';
import { PlayerController } from '@client/feature/player/player-controller';
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
  private readonly playerController = new PlayerController();
  private readonly gameLoop = new GameLoop({
    fixedDeltaSeconds: 1 / 60,
    maxStepsPerFrame: 5,
    maxFrameDeltaSeconds: 0.25,
  });
  private playerFish: Fish | null = null;
  private fishElement: HTMLDivElement | null = null;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.playerController.connect();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.playerController.disconnect();
    this.gameLoop.stop();
  }

  protected firstUpdated() {
    this.ensureFish();
    this.fishElement = this.renderRoot.querySelector('.player-fish');
    this.gameLoop.start(this.step, this.renderFrame);
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('seed')) {
      this.layout = generateLayout(normalizeSeed(this.seed));
      this.resetFishPosition();
    }
  }

  private ensureFish() {
    if (this.playerFish) {
      return;
    }
    const { width, height } = this.layout;
    this.playerFish = new Fish('player', { x: width * 0.5, y: height * 0.5 }, { spriteSrc: defaultFishAsset });
  }

  private resetFishPosition() {
    if (!this.playerFish) {
      return;
    }
    const { width, height } = this.layout;
    this.playerFish.position = { x: width * 0.5, y: height * 0.5 };
    this.playerFish.velocity = { x: 0, y: 0 };
  }

  private step = (deltaSeconds: number) => {
    if (!this.playerFish) {
      return;
    }
    const input = this.playerController.getDirection();
    this.playerFish.update(deltaSeconds, input);
  };

  private renderFrame = () => {
    if (!this.playerFish || !this.fishElement) {
      return;
    }
    const renderState = this.playerFish.getRenderState();
    const angle = renderState.rotation + renderState.wiggleAngle;
    this.fishElement.style.transform = `translate(${renderState.position.x}px, ${-renderState.position.y}px) rotate(${angle}rad)`;
  };

  render() {
    const { terrain, rocks, seaweed, bubbles } = this.layout;
    const fishSprite = this.playerFish?.getRenderState().spriteSrc ?? defaultFishAsset;
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

          <div class="player-fish" style="transform: translate(-9999px, -9999px);">
            <img src=${fishSprite} alt="Player fish" />
          </div>

          <div class="game-hud">
            <span class="game-seed">Seed</span>
            <span>${this.layout.seed}</span>
          </div>
        </div>
      </section>
    `;
  }
}
