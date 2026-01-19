import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Difficulty, Gamemode } from '@shared/types';

@customElement('lobby-controls')
export class LobbyControls extends LitElement {
  @property({ type: String }) lobbyId = '';
  @property({ type: String }) gamemode: Gamemode = 'multiplayer';
  @property({ type: String }) difficulty: Difficulty = 'easy';
  @property({ type: Boolean }) isLeader = false;
  @property({ type: String }) shareUrl = '';

  createRenderRoot() {
    return this;
  }

  private setGamemode(mode: Gamemode) {
    if (!this.isLeader) return;
    this.dispatchEvent(
      new CustomEvent('change-settings', {
        detail: { gamemode: mode, difficulty: this.difficulty, lobbyId: this.lobbyId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private setDifficulty(level: Difficulty) {
    if (!this.isLeader) return;
    this.dispatchEvent(
      new CustomEvent('change-settings', {
        detail: { gamemode: this.gamemode, difficulty: level, lobbyId: this.lobbyId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private startGame() {
    if (!this.isLeader) return;
    this.dispatchEvent(
      new CustomEvent('start-game', {
        detail: { lobbyId: this.lobbyId },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="panel stack">
        <div class="row">
          <span>Gamemode:</span>
          <button type="button" class=${this.gamemode === 'singleplayer' ? '' : 'secondary'} @click=${() => this.setGamemode('singleplayer')}>
            Singleplayer
          </button>
          <button type="button" class=${this.gamemode === 'multiplayer' ? '' : 'secondary'} @click=${() => this.setGamemode('multiplayer')}>
            Multiplayer
          </button>
        </div>

        <div class="row">
          <span>Difficulty:</span>
          ${(['easy', 'medium', 'hard'] as Difficulty[]).map(
            (lvl) => html`
              <button type="button" class=${this.difficulty === lvl ? '' : 'secondary'} @click=${() => this.setDifficulty(lvl)}>
                ${lvl[0].toUpperCase() + lvl.slice(1)}
              </button>
            `
          )}
        </div>

        <share-url .url=${this.shareUrl}></share-url>

        ${this.isLeader
          ? html`<button type="button" class="warn" @click=${this.startGame}>Start Game</button>`
          : html`<div>Waiting for leader to start...</div>`}
      </div>
    `;
  }
}
