import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('game-bubble')
export class BubbleSprite extends LitElement {
  @property({ type: String }) src = '';
  @property({ type: Number }) size = 1;
  @property({ type: Number }) durationMs = 6000;
  @property({ type: Number }) delayMs = 0;
  @property({ type: Number }) startYOffset = 0;
  @property({ type: Number }) endYOffset = 120;

  createRenderRoot() {
    return this;
  }

  render() {
    const scale = Number.isFinite(this.size) ? this.size : 1;
    const duration = Number.isFinite(this.durationMs) ? this.durationMs : 6000;
    const delay = Number.isFinite(this.delayMs) ? this.delayMs : 0;
    const start = Number.isFinite(this.startYOffset) ? this.startYOffset : 0;
    const end = Number.isFinite(this.endYOffset) ? this.endYOffset : 120;
    return html`
      <img
        class="ambient-sprite bubble bubble-rise"
        src=${this.src}
        alt=""
        style="--bubble-scale: ${scale}; --bubble-duration: ${duration}ms; --bubble-delay: ${delay}ms; --bubble-rise-start: ${start}px; --bubble-rise-end: ${end}px;"
      />
    `;
  }
}
