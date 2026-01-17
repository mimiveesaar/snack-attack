import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { LeaderboardEntry } from '@shared/types';

@customElement('waiting-view')
export class WaitingView extends LitElement {
  @property({ type: Array }) leaderboard: LeaderboardEntry[] = [];
  @property({ type: Number }) timerRemainingMs = 0;

  createRenderRoot() {
    return this;
  }

  render() {
    const seconds = Math.max(0, Math.round(this.timerRemainingMs / 1000));
    return html`
      <div class="panel stack waiting-view">
        <h2>Game in progress</h2>
        <div class="timer">Next game in ~${seconds}s</div>
        <div class="stack">
          <h3>Leaderboard</h3>
          ${this.leaderboard.length === 0
            ? html`<div>No scores yet</div>`
            : this.leaderboard.map((entry) => html`<div>${entry.nicknameDisplay}: ${entry.score}</div>`)}
        </div>
        <div>Waiting for new game...</div>
      </div>
    `;
  }
}
