import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Vec2 } from '@shared/types/vec2';
import { getFishRotation, getFishWiggleAngle, updateFishMovement } from './fish.movement';

export interface FishConfig {
  maxSpeed: number;
  acceleration: number;
  drag: number;
  wiggleAmplitude: number;
  wiggleSpeed: number;
  spriteSrc: string;
}

export interface FishRenderState {
  position: Vec2;
  rotation: number;
  wiggleAngle: number;
  spriteSrc: string;
}

const DEFAULT_CONFIG: FishConfig = {
  maxSpeed: 220,
  acceleration: 620,
  drag: 420,
  wiggleAmplitude: 0.18,
  wiggleSpeed: 6,
  spriteSrc: '',
};

export class FishEntity {
  readonly id: string;
  position: Vec2;
  velocity: Vec2;
  facingDirection: Vec2;
  private wigglePhase = 0;
  private readonly config: FishConfig;

  constructor(id: string, position: Vec2, config: Partial<FishConfig>) {
    this.id = id;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.facingDirection = { x: 1, y: 0 };
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  update(deltaSeconds: number, inputDirection: Vec2) {
    const state = {
      position: this.position,
      velocity: this.velocity,
      facingDirection: this.facingDirection,
      wigglePhase: this.wigglePhase,
    };

    updateFishMovement(state, deltaSeconds, inputDirection, this.config);

    this.position = state.position;
    this.velocity = state.velocity;
    this.facingDirection = state.facingDirection;
    this.wigglePhase = state.wigglePhase;
  }

  getRenderState(): FishRenderState {
    const rotation = getFishRotation(this.facingDirection);
    const wiggleAngle = getFishWiggleAngle(this.wigglePhase, this.config.wiggleAmplitude);
    return {
      position: { ...this.position },
      rotation,
      wiggleAngle,
      spriteSrc: this.config.spriteSrc,
    };
  }
}

@customElement('game-fish')
export class Fish extends LitElement {
  @property({ type: String }) spriteSrc = '';
  @property({ attribute: false }) renderState: FishRenderState | null = null;

  createRenderRoot() {
    return this;
  }

  setRenderState(state: FishRenderState) {
    this.renderState = state;
  }

  render() {
    const renderState = this.renderState;
    const isFacingLeft = renderState ? Math.cos(renderState.rotation) < 0 : false;
    const mirror = isFacingLeft ? ' scaleX(-1)' : '';
    const maxTilt = 0.35;
    const verticalTilt = renderState ? -Math.sin(renderState.rotation) * maxTilt : 0;
    const transform = renderState
      ? `translate(${renderState.position.x}px, ${-renderState.position.y}px)${mirror} rotate(${verticalTilt}rad)`
      : 'translate(-9999px, -9999px)';
    const spriteSrc = renderState?.spriteSrc ?? this.spriteSrc;

    return html`
      <div class="player-fish" style="transform: ${transform};">
        <img src=${spriteSrc} alt="Player fish" />
      </div>
    `;
  }
}
