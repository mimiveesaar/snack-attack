import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('terrain-layer')
export class TerrainLayer extends LitElement {
  @property({ type: String }) dirtSrc = '';
  @property({ type: String }) sandSrc = '';

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div class="terrain-layer" role="presentation">
        <img class="terrain-sand" src=${this.sandSrc} alt="" />
        <img class="terrain-dirt" src=${this.dirtSrc} alt="" />
      </div>
    `;
  }
}
