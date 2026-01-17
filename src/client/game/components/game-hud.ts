import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * GameHUD - Heads-up display for game timer, pause button, and end screen overlay
 *
 * Responsibilities:
 * - Display countdown timer (MM:SS:ms format, upper-left corner)
 * - Pause button (leader only, center-top)
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

    .pause-button {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      font-family: 'Courier New', monospace;
      background-color: #4a90e2;
      color: white;
      border: 2px solid black;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      z-index: 101;
      transition: background-color 0.2s;
    }

    .pause-button:hover:not(:disabled) {
      background-color: #357abd;
    }

    .pause-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      opacity: 0.5;
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
      z-index: 300;
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
  showEndScreen(winner: any, leaderboard: any[]): void {
    this.isGameEnded = true;
    this.gameEndResults = { winner, leaderboard };
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
  private handleReturnToLobby(): void {
    this.dispatchEvent(
      new CustomEvent('return-to-lobby', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleNewGame(): void {
    this.dispatchEvent(
      new CustomEvent('new-game', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <!-- Timer -->
      <div class="timer">${this.formatTime(this.timerRemainingMs)}</div>

      <!-- Pause button (leader only) -->
      ${this.isLeader
        ? html`<button
            class="pause-button"
            @click=${this.handlePauseToggle}
            ?disabled=${this.isGameEnded}
          >
            ${this.isPaused ? 'RESUME' : 'PAUSE'}
          </button>`
        : ''}

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
              <h1>GAME OVER</h1>

              ${this.gameEndResults.winner
                ? html`<div class="winner-section">
                    <div class="winner-name">🏆 ${this.gameEndResults.winner.nicknameDisplay}</div>
                    <div class="winner-xp">${this.gameEndResults.winner.xp} XP</div>
                  </div>`
                : html`<div class="winner-section"><div class="winner-name">Draw</div></div>`}

              ${this.gameEndResults.leaderboard && this.gameEndResults.leaderboard.length > 0
                ? html`<div class="leaderboard-section">
                    <div class="leaderboard-title">Leaderboard</div>
                    ${this.gameEndResults.leaderboard.map(
                      (entry: any, idx: number) => html`
                        <div class="leaderboard-entry">
                          <span>#${idx + 1} ${entry.nicknameDisplay}</span>
                          <span>${entry.xp} XP</span>
                        </div>
                      `
                    )}
                  </div>`
                : ''}

              <div class="action-buttons">
                <button class="action-button" @click=${this.handleReturnToLobby}>Return to Lobby</button>
                <button class="action-button" @click=${this.handleNewGame}>New Game</button>
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
