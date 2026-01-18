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
 * GameSidebar Component - Complete sidebar with all game information
 * 
 * Features:
 * - Help button (?) in upper left
 * - Pause button in upper right (leader only)
 * - Quit button in upper right
 * - Player Score display
 * - Fish-o-meter (growth phase progress)
 * - Leaderboard with rankings
 */
@customElement('game-sidebar')
export class GameSidebar extends LitElement {
  @state() private playerScore: number = 0;
  @state() private playerXP: number = 0;
  @state() private growthPhase: 1 | 2 | 3 = 1;
  @state() private leaderboard: LeaderboardEntry[] = [];
  @state() private isLeader: boolean = false;
  @state() private showHelp: boolean = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #ADC8AF;
    }

    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 1rem;
      font-family: 'Courier New', monospace;
      background:#ADC8AF
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .help-button {
      width: 30px;
      height: 30px;
      background: #4a90e2;
      color: white;
      border: 2px solid black;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .help-button:hover {
      background: #357abd;
    }

    .control-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .pause-button, .quit-button {
      padding: 0.25rem 0.75rem;
      background: #4a90e2;
      color: white;
      border: 2px solid black;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-weight: bold;
      transition: background 0.2s;
    }

    .pause-button:hover:not(:disabled),
    .quit-button:hover {
      background: #357abd;
    }

    .pause-button:disabled {
      background: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .quit-button {
      background: #e74c3c;
    }

    .quit-button:hover {
      background: #c0392b;
    }

    .score-section {
      background: #ADC8AF;
      border: 2px solid black;
      border-radius: 4px;
      padding: 0.75rem;
      text-align: center;
    }

    .score-label {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .score-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }

    .fish-o-meter {
      background: #ADC8AF;
      border: 2px solid black;
      border-radius: 4px;
      padding: 0.75rem;
    }

    .fish-o-meter-title {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .fish-o-meter-content {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
    }

    .fish-levels {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 50px;
    }

    .fish-icon {
      width: 40px;
      height: 40px;
      border: 1px solid #ADC8AF;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ADC8AF;
    }

    .fish-icon img {
      width: 35px;
      height: 35px;
      object-fit: contain;
    }

    .progress-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .progress-bar-container {
      height: 120px;
      background: #78a75d;
      border: 2px solid black;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .progress-bar-dividers {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .phase-divider {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2;
    }

    .progress-bar-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
      transition: height 0.3s ease;
    }

    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      font-weight: bold;
      color: #333;
      background: rgba(255, 255, 255, 0.8);
      padding: 2px 4px;
      border-radius: 2px;
    }

    .leaderboard-section {
      flex: 1;
      background: #ADC8AF;
      border: 2px solid black;
      border-radius: 4px;
      padding: 0.75rem;
      overflow-y: auto;
      min-height: 0;
    }

    .leaderboard-title {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #ccc;
      padding-bottom: 0.25rem;
    }

    .leaderboard-entry {
      display: flex;
      align-items: center;
      padding: 0.25rem 0;
      border-bottom: 1px solid #eee;
      font-size: 11px;
    }

    .leaderboard-entry:last-child {
      border-bottom: none;
    }

    .entry-rank {
      width: 1.5rem;
      font-weight: bold;
      color: #666;
    }

    .entry-rank.top {
      color: #ffd700;
      font-size: 1.2em;
    }

    .entry-name {
      flex: 1;
      margin-left: 0.25rem;
    }

    .entry-name.quit {
      color: #999;
      text-decoration: line-through;
    }

    .entry-leader-badge {
      background: #ffd700;
      color: #000;
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 2px;
      margin-left: 0.25rem;
      font-weight: bold;
    }

    .entry-xp {
      margin-left: 0.5rem;
      min-width: 2.5rem;
      text-align: right;
      font-weight: bold;
    }

    .help-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .help-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .help-content h2 {
      margin-top: 0;
    }

    .help-content ul {
      text-align: left;
    }

    .close-button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #4a90e2;
      color: white;
      border: 2px solid black;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .close-button:hover {
      background: #357abd;
    }
  `;

  /**
   * Update player's current score
   */
  updatePlayerScore(xp: number, growthPhase: 1 | 2 | 3) {
    this.playerScore = xp;
    this.playerXP = xp;
    this.growthPhase = growthPhase;
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(entries: LeaderboardEntry[]) {
    this.leaderboard = entries;
  }

  /**
   * Set whether current player is the leader
   */
  setIsLeader(isLeader: boolean) {
    this.isLeader = isLeader;
  }

  /**
   * Calculate progress percentage for Fish-o-meter
   * Bar is divided into thirds:
   * - Bottom third (0-33.33%): Phase 1 (0-50 XP)
   * - Middle third (33.33-66.66%): Phase 2 (50-150 XP)
   * - Top third (66.66-100%): Phase 3 (150+ XP)
   */
  private getFishOMeterProgress(): number {
    const PHASE_1_MAX = 50;    // 0-50 XP
    const PHASE_2_MAX = 150;   // 50-150 XP
    const PHASE_3_MAX = 300;   // 150-300 XP (visual max)

    if (this.playerXP <= PHASE_1_MAX) {
      // Phase 1: Fill 0% to 33.33%
      return (this.playerXP / PHASE_1_MAX) * 33.33;
    } else if (this.playerXP <= PHASE_2_MAX) {
      // Phase 2: Fill 33.33% to 66.66%
      const progressInPhase2 = (this.playerXP - PHASE_1_MAX) / (PHASE_2_MAX - PHASE_1_MAX);
      return 33.33 + (progressInPhase2 * 33.33);
    } else {
      // Phase 3: Fill 66.66% to 100%
      const progressInPhase3 = Math.min((this.playerXP - PHASE_2_MAX) / (PHASE_3_MAX - PHASE_2_MAX), 1);
      return 66.66 + (progressInPhase3 * 33.34);
    }
  }

  private handleHelp() {
    this.showHelp = true;
  }

  private closeHelp() {
    this.showHelp = false;
  }

  private handlePause() {
    this.dispatchEvent(new CustomEvent('pause-toggle', {
      bubbles: true,
      composed: true
    }));
  }

  private handleQuit() {
    this.dispatchEvent(new CustomEvent('quit-game', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    const progress = this.getFishOMeterProgress();

    return html`
      <div class="sidebar-container">
        <!-- Header with Help and Controls -->
        <div class="sidebar-header">
          <button class="help-button" @click=${this.handleHelp} title="Game Rules">
            ?
          </button>
          <div class="control-buttons">
            <button 
              class="pause-button" 
              ?disabled=${!this.isLeader}
              @click=${this.handlePause}
              title=${this.isLeader ? 'Pause Game' : 'Only leader can pause'}
            >
              ${this.isLeader ? 'PAUSE' : 'PAUSE'}
            </button>
            <button class="quit-button" @click=${this.handleQuit}>
              QUIT
            </button>
          </div>
        </div>

        <!-- Player Score -->
        <div class="score-section">
          <div class="score-label">SCORE</div>
          <div class="score-value">${this.playerScore}</div>
        </div>

        <!-- Fish-o-meter -->
        <div class="fish-o-meter">
          <div class="fish-o-meter-title">FISH-O-METER</div>
          <div class="fish-o-meter-content">
            <div class="fish-levels">
              <div class="fish-icon" title="Brown Fish - Phase 3">
                <img src="/assets/Vector/fish_brown.svg" alt="Brown fish" />
              </div>
              <div class="fish-icon" title="Grey Fish - Phase 2">
                <img src="/assets/Vector/fish_grey.svg" alt="Grey fish" />
              </div>
              <div class="fish-icon" title="Pink Fish - Phase 1">
                <img src="/assets/Vector/fish_pink.svg" alt="Pink fish" />
              </div>
            </div>
            <div class="progress-column">
              <div class="progress-bar-container">
                <!-- Phase dividers -->
                <div class="progress-bar-dividers">
                  <div class="phase-divider" style="bottom: 66.66%"></div>
                  <div class="phase-divider" style="bottom: 33.33%"></div>
                </div>
                <!-- Progress fill -->
                <div class="progress-bar-fill" style="height: ${progress}%"></div>
                <!-- <div class="progress-text">
                  Phase ${this.growthPhase}
                </div> -->
              </div>
            </div>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="leaderboard-section">
          <div class="leaderboard-title">LEADERBOARD</div>
          ${this.leaderboard.map((entry) => html`
            <div class="leaderboard-entry">
              <div class="entry-rank ${entry.rank === 1 ? 'top' : ''}">
                ${entry.rank}.
              </div>
              <div class="entry-name ${entry.status === 'quit' ? 'quit' : ''}">
                ${entry.nicknameDisplay}
                ${entry.isLeader ? html`<span class="entry-leader-badge">LEADER</span>` : ''}
              </div>
              <div class="entry-xp">${entry.xp}</div>
            </div>
          `)}
        </div>
      </div>

      ${this.showHelp ? html`
        <div class="help-overlay" @click=${this.closeHelp}>
          <div class="help-content" @click=${(e: Event) => e.stopPropagation()}>
            <h2>🐟 Snack Attack - Game Rules</h2>
            
            <h3>Objective</h3>
            <p>Eat other fish to gain XP and become the biggest fish in 2 minutes!</p>

            <h3>How to Play</h3>
            <ul>
              <li>Use arrow keys or WASD to move your fish</li>
              <li>Eat fish smaller than you to gain XP</li>
              <li>Avoid fish bigger than you or they'll eat you!</li>
              <li>Grow through 3 phases as you gain XP</li>
            </ul>

            <h3>Eating Rules</h3>
            <ul>
              <li>You can only eat fish with less XP than you</li>
              <li>Pink NPCs: 10 XP (easiest)</li>
              <li>Grey NPCs: 25 XP (medium)</li>
              <li>Brown NPCs: 50 XP (hardest)</li>
              <li>If eaten, you respawn at base size</li>
            </ul>

            <h3>Growth Phases</h3>
            <ul>
              <li>Phase 1: 0-50 XP (small)</li>
              <li>Phase 2: 50-150 XP (medium)</li>
              <li>Phase 3: 150+ XP (large)</li>
            </ul>

            <h3>Power-ups</h3>
            <ul>
              <li>⚡ Speed Boost: 1.2x movement speed (10s)</li>
              <li>✨ Double XP: 2x points from eating (10s)</li>
            </ul>

            <h3>Controls</h3>
            <ul>
              <li>Leader can pause/resume the game</li>
              <li>Anyone can quit at any time</li>
            </ul>

            <button class="close-button" @click=${this.closeHelp}>Close</button>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'game-sidebar': GameSidebar;
  }
}
