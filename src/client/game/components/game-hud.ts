import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * GameHUD - Heads-up display for game timer and overlays
 *
 * Responsibilities:
 * - Display countdown timer (MM:SS:ms format, upper-left corner)
 * - Game end overlay with results screen
 * - Pause overlay indicating pause state
 */

@customElement('game-hud')
export class GameHUD extends LitElement {
  @state() timerRemainingMs: number = 120000; // 2 minutes
  @state() isPaused: boolean = false;
  @state() pausedByLeaderNickname: string | null = null;
  @state() isGameEnded: boolean = false;
  @state() isLeader: boolean = false;
  @state() gameEndResults: any = null;

  static styles = css`
    :host {
      display: contents;
    }

    .timer {
      position: absolute;
      top: 10px;
      left: 10px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: black;
      background: rgba(255, 255, 255, 0.8);
      padding: 4px 8px;
      border-radius: 4px;
      z-index: 101;
    }

    .pause-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }

    .pause-message {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      font-family: 'Courier New', monospace;
      max-width: 300px;
    }

    .pause-message h2 {
      margin: 0 0 1rem 0;
      font-size: 24px;
    }

    .pause-message p {
      margin: 0;
      font-size: 14px;
    }

    .end-screen-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100; /* Higher than sidebar (1000) */
    }

    .end-screen {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      font-family: 'Courier New', monospace;
      max-width: 400px;
    }

    .end-screen h1 {
      margin: 0 0 1rem 0;
      font-size: 28px;
      color: #2c3e50;
    }

    .player-rank-section {
      background: #3498db;
      color: white;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-weight: bold;
    }

    .player-rank-section.rank-1 {
      background: #ffd700;
      color: #000;
    }

    .player-rank-section.rank-2 {
      background: #c0c0c0;
      color: #000;
    }

    .player-rank-section.rank-3 {
      background: #cd7f32;
      color: #fff;
    }

    .rank-text {
      font-size: 20px;
      margin-bottom: 0.5rem;
    }

    .rank-details {
      font-size: 14px;
      opacity: 0.9;
    }

    .winner-section {
      background: #ffd700;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .winner-name {
      font-size: 18px;
      font-weight: bold;
    }

    .winner-xp {
      font-size: 14px;
      color: #666;
    }

    .leaderboard-section {
      margin-bottom: 1rem;
      text-align: left;
      max-height: 150px;
      overflow-y: auto;
    }

    .leaderboard-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .leaderboard-entry {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      font-size: 12px;
      border-bottom: 1px solid #eee;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .action-button {
      padding: 0.5rem 1rem;
      font-family: 'Courier New', monospace;
      background-color: #4a90e2;
      color: white;
      border: 2px solid black;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }

    .action-button:hover {
      background-color: #357abd;
    }
  `;

  /**
   * Format milliseconds to MM:SS:ms
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${Math.floor(milliseconds / 10)
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Update timer (called every frame from game loop)
   */
  updateTimer(ms: number): void {
    this.timerRemainingMs = ms;
  }

  /**
   * Update pause state
   */
  updatePauseState(isPaused: boolean, pausedByLeaderNickname: string | null): void {
    this.isPaused = isPaused;
    this.pausedByLeaderNickname = pausedByLeaderNickname;
  }

  /**
   * Set leader status
   */
  setIsLeader(isLeader: boolean): void {
    this.isLeader = isLeader;
  }

  /**
   * Show end screen
   */
  showEndScreen(winner: any, leaderboard: any[], selfPlayerId: string): void {
    this.isGameEnded = true;
    this.gameEndResults = { winner, leaderboard, selfPlayerId };
  }

  /**
   * Emit pause toggle event
   */
  private handlePauseToggle(): void {
    this.dispatchEvent(
      new CustomEvent('pause-toggle', {
        detail: { isPaused: !this.isPaused },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Emit navigation events
   */
  private handlePlayAgain(): void {
    this.dispatchEvent(
      new CustomEvent('play-again', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleLeaveGame(): void {
    this.dispatchEvent(
      new CustomEvent('leave-game', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <!-- Timer -->
      <div class="timer">${this.formatTime(this.timerRemainingMs)}</div>

      <!-- Pause overlay -->
      ${this.isPaused
        ? html`<div class="pause-overlay">
            <div class="pause-message">
              <h2>PAUSED</h2>
              <p>${this.pausedByLeaderNickname ? `by ${this.pausedByLeaderNickname}` : ''}</p>
              ${!this.isLeader ? html`<p style="margin-top: 1rem; color: #666;">You cannot unpause. Leader only.</p>` : ''}
            </div>
          </div>`
        : ''}

      <!-- End screen overlay -->
      ${this.isGameEnded && this.gameEndResults
        ? html`<div class="end-screen-overlay">
            <div class="end-screen">
              <h1>🐟 GAME FINISHED! 🐟</h1>

              ${(() => {
                // Check if it's a draw
                if (this.gameEndResults.isDraw) {
                  const topXP = this.gameEndResults.leaderboard[0]?.xp || 0;
                  const tiedPlayers = this.gameEndResults.leaderboard.filter(
                    (entry: any) => entry.xp === topXP
                  );
                  return html`<div class="player-rank-section rank-1">
                      <div class="rank-text">
                        🤝 IT'S A DRAW! 🤝
                      </div>
                      <div class="rank-details">
                        ${tiedPlayers.map((p: any) => p.nicknameDisplay).join(', ')} tied with ${topXP} XP
                      </div>
                    </div>`;
                }

                const selfEntry = this.gameEndResults.leaderboard.find(
                  (entry: any) => entry.playerId === this.gameEndResults.selfPlayerId
                );
                return selfEntry
                  ? html`<div class="player-rank-section rank-${selfEntry.rank}">
                      <div class="rank-text">
                        ${selfEntry.rank === 1 ? '🏆 YOU WON!' : `Your Rank: #${selfEntry.rank}`}
                      </div>
                      <div class="rank-details">
                        ${selfEntry.nicknameDisplay} - ${selfEntry.xp} XP
                      </div>
                    </div>`
                  : '';
              })()}

              ${this.gameEndResults.leaderboard && this.gameEndResults.leaderboard.length > 0
                ? html`<div class="leaderboard-section">
                    <div class="leaderboard-title">Final Leaderboard</div>
                    ${this.gameEndResults.leaderboard.map(
                      (entry: any) => html`
                        <div class="leaderboard-entry">
                          <span>
                            ${entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                            ${entry.nicknameDisplay}
                            ${entry.playerId === this.gameEndResults.selfPlayerId ? ' (You)' : ''}
                          </span>
                          <span>${entry.xp} XP</span>
                        </div>
                      `
                    )}
                  </div>`
                : ''}

              <div class="action-buttons">
                <button class="action-button" @click=${this.handlePlayAgain}>Play Again</button>
                <button class="action-button" @click=${this.handleLeaveGame}>Leave Game</button>
              </div>
            </div>
          </div>`
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'game-hud': GameHUD;
  }
}
