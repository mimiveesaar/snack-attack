import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Player } from '@shared/types';
import { colorToFishAsset, colorToName } from '../utils/colors';

@customElement('player-list')
export class PlayerList extends LitElement {
  @property({ type: Array }) players: Player[] = [];
  @property({ type: Number }) maxPlayers = 4;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div class="player-grid">
        <div class="count-indicator">${this.players.length} / ${this.maxPlayers}</div>
        ${this.players.map((p) => {
          const fishAsset = colorToFishAsset[p.color] ?? 'fish_blue';
          const fishName = colorToName[p.color] ?? 'Fish';
          return html`
            <div class="player-badge">
              <img
                class="player-fish-icon"
                src="/assets/vector/${fishAsset}.svg"
                alt="${fishName} fish"
              />
              <span>${p.nicknameDisplay}</span>
              ${p.isLeader ? html`<span class="leader-flag">Leader</span>` : null}
            </div>
          `;
        })}
      </div>
    `;
  }
}
