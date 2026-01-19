import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('game-rock')
export class RockSprite extends LitElement {
  @property({ type: String }) src = '';
  @property({ type: Number }) size = 1;

  createRenderRoot() {
    return this;
  }

  render() {
    const scale = Number.isFinite(this.size) ? this.size : 1;
    return html`<img class="ambient-sprite rock" src=${this.src} alt="" style="transform: scale(${scale});" />`;
  }
}
