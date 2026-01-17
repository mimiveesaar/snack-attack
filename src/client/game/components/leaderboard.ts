import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface LeaderboardEntry {
  playerId: string;
  nicknameDisplay: string;
  rank: number;
  xp: number;
  status: 'active' | 'respawning' | 'spectating' | 'quit';
  isLeader: boolean;
}

/**
 * Leaderboard Component - Real-time score rankings display
 */
@customElement('game-leaderboard')
export class GameLeaderboard extends LitElement {
  @state() entries: LeaderboardEntry[] = [];

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .leaderboard {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.5rem;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .leaderboard-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
      text-align: center;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.25rem;
    }

    .entry {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      border-bottom: 1px solid #eee;
      align-items: center;
    }

    .entry:last-child {
      border-bottom: none;
    }

    .rank {
      width: 1.5rem;
      font-weight: bold;
      color: #666;
    }

    .rank.leader {
      color: #ffd700;
      font-size: 1.2em;
    }

    .name {
      flex: 1;
      margin-left: 0.5rem;
    }

    .name.quit {
      color: #999;
      text-decoration: line-through;
    }

    .xp {
      margin-left: 0.5rem;
      min-width: 2rem;
      text-align: right;
      font-weight: bold;
    }

    .status-indicator {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      margin-left: 0.25rem;
    }

    .status-alive {
      background-color: #00cc00;
    }

    .status-respawning {
      background-color: #ffcc00;
    }

    .status-spectating {
      background-color: #cccccc;
    }

    .status-quit {
      background-color: #cc0000;
    }
  `;

  /**
   * Update leaderboard entries
   */
  setEntries(entries: LeaderboardEntry[]): void {
    this.entries = entries;
  }

  render() {
    return html`
      <div class="leaderboard">
        <div class="leaderboard-title">LEADERBOARD</div>
        ${this.entries.map(
          (entry) => html`
            <div class="entry">
              <div class="rank ${entry.isLeader ? 'leader' : ''}">
                ${entry.isLeader ? '👑' : `#${entry.rank}`}
              </div>
              <div class="name ${entry.status === 'quit' ? 'quit' : ''}">${entry.nicknameDisplay}</div>
              <div class="xp">${entry.xp}</div>
              <div class="status-indicator status-${entry.status}"></div>
            </div>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'game-leaderboard': GameLeaderboard;
  }
}
