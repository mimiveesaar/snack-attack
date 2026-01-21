import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ActiveGameSnapshot } from '@shared/types';

@customElement('waiting-view')
export class WaitingView extends LitElement {
  @property({ type: Object }) snapshot: ActiveGameSnapshot = {
    hasActiveGame: false,
    timerRemainingMs: null,
    leaderboard: [],
  };
  @property({ type: String }) fullMessage: string | null = null;

  createRenderRoot() {
    return this;
  }

  render() {
    const seconds = Math.max(0, Math.round((this.snapshot.timerRemainingMs ?? 0) / 1000));
    return html`
      <div class="panel stack waiting-view">
        <h2>${this.snapshot.hasActiveGame ? 'Game in progress' : 'Waiting for next game'}</h2>
        <div class="timer">
          ${this.snapshot.hasActiveGame ? html`Next game in ~${seconds}s` : html`No active game`}
        </div>
        ${this.fullMessage ? html`<div class="inline-error">${this.fullMessage}</div>` : null}
        <div class="stack">
          <h3>Leaderboard</h3>
          ${this.snapshot.hasActiveGame
            ? this.snapshot.leaderboard.length === 0
              ? html`<div>No scores yet</div>`
              : this.snapshot.leaderboard.map(
                  (entry) => html`<div>${entry.rank}. ${entry.nicknameDisplay}: ${entry.score}</div>`
                )
            : html`<div>No active game</div>`}
        </div>
        <div>Waiting for new game...</div>
      </div>
    `;
  }
}
