import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Player } from '@shared/types';

@customElement('player-list')
export class PlayerList extends LitElement {
  @property({ type: Array }) players: Player[] = [];
  @property({ type: Number }) maxPlayers = 4;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div class="stack">
        <div class="count-indicator">${this.players.length} / ${this.maxPlayers}</div>
        ${this.players.map(
          (p) => html`
            <div class="player-badge">
              <span class="color-swatch" style="background:${p.color}"></span>
              <span>${p.nicknameDisplay}</span>
              ${p.isLeader ? html`<span class="leader-flag">Leader</span>` : null}
            </div>
          `
        )}
      </div>
    `;
  }
}
