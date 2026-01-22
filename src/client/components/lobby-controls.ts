import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Difficulty, Gamemode } from "@shared/types";

@customElement("lobby-controls")
export class LobbyControls extends LitElement {
  @property({ type: String }) lobbyId = "";
  @property({ type: String }) gamemode: Gamemode = "multiplayer";
  @property({ type: String }) difficulty: Difficulty = "easy";
  @property({ type: Boolean }) isLeader = false;
  @property({ type: String }) shareUrl = "";

  static styles = css`
    .row {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .row button {
      font-family: "Jersey 10", system-ui, sans-serif;
      font-size: 16px;
      background: #8d9e8e;
      border: 2px solid var(--border);
      border-radius: 4px;
      color: black;
      width: 150px;
      padding: 8px 12px;
      margin-top: 6px;
      cursor: pointer;
      box-shadow:
        -2px 3px 0 var(--accent-dark),
        0 6px 12px var(--shadow);
    }

    .row button.locked {
      background: #9aa3a0;
      color: #2f2f2f;
      cursor: not-allowed;
      box-shadow: none;
      filter: grayscale(0.6);
      opacity: 0.8;
    }

    .button:active {
      transform: translateY(4px);
      box-shadow:
        0 1px 0 var(--accent-dark),
        0 4px 8px var(--shadow);
      background: #bccfbc;
    }

    button.selected {
      outline: 2px solid #7be95d;
      background: #bccfbc;
    }

    share-url button {
      font-family: "Jersey 10", system-ui, sans-serif;
      background: #8d9e8e;
      border: 2px solid var(--border);
      border-radius: 4px;
      color: black;
      padding: 8px 12px;

      cursor: pointer;
      box-shadow:
        -2px 3px 0 var(--accent-dark),
        0 6px 12px var(--shadow);
    }

    share-url button:active {
      transform: translateY(4px);
      box-shadow:
        0 1px 0 var(--accent-dark),
        0 4px 8px var(--shadow);
    }

    button.difficulty.easy {
      background: #8fd19e;
    }

    button.difficulty.medium {
      background: #f2c94c;
    }

    button.difficulty.hard {
      background: #eb5757;
    }

    button.difficulty.active {
      outline: 3px solid var(--accent-primary);
      font-weight: bold;
    }

    .start-game-button {
      font-family: "Jersey 10", system-ui, sans-serif;
      font-size: 20px;
      margin-top: auto;
      background: var(--accent-primary);
      border: 2px solid var(--border);
      cursor: pointer;
      box-shadow:
        -2px 3px 0 var(--accent-dark),
        0 6px 12px var(--shadow);
      margin-bottom: 10px;
      padding: 8px 12px;
    }

    .left-box {
      display: flex;
      gap: 48px;
      margin-bottom: 40px;
    }

    .label {
      font-size: 24px;
    }

    share-url .share-icon {
      width: 16px;
      height: 16px;
    }

    share-url button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
  `;

  private setGamemode(mode: Gamemode) {
    if (!this.isLeader) return;
    this.dispatchEvent(
      new CustomEvent("change-settings", {
        detail: {
          gamemode: mode,
          difficulty: this.difficulty,
          lobbyId: this.lobbyId,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private setDifficulty(level: Difficulty) {
    if (!this.isLeader) return;
    this.dispatchEvent(
      new CustomEvent("change-settings", {
        detail: {
          gamemode: this.gamemode,
          difficulty: level,
          lobbyId: this.lobbyId,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private startGame() {
    if (!this.isLeader) return;
    this.dispatchEvent(
      new CustomEvent("start-game", {
        detail: { lobbyId: this.lobbyId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="stack">
        <div class="left-box">
          <div class="stack">
            <span class="label">Gamemode:</span>

            <div class="row">
              <button
                type="button"
                class=${`${this.gamemode === "singleplayer" ? "selected" : "secondary"} ${
                  !this.isLeader ? "locked" : ""
                }`}
                @click=${() => this.setGamemode("singleplayer")}
              >
                Singleplayer
              </button>

              <button
                type="button"
                class=${`${this.gamemode === "multiplayer" ? "selected" : "secondary"} ${
                  !this.isLeader ? "locked" : ""
                }`}
                @click=${() => this.setGamemode("multiplayer")}
              >
                Multiplayer
              </button>
              <share-url .url=${this.shareUrl}></share-url>
            </div>
          </div>

          <div>
            <div class="stack">
              <span class="label">Difficulty:</span>

              <div class="row">
                ${(["easy", "medium", "hard"] as Difficulty[]).map(
                  (lvl) => html`
                    <button
                      type="button"
                      class="difficulty ${lvl} ${this.difficulty === lvl
                        ? "selected"
                        : "secondary"} ${!this.isLeader ? "locked" : ""}"
                      @click=${() => this.setDifficulty(lvl)}
                    >
                      ${lvl[0].toUpperCase() + lvl.slice(1)}
                    </button>
                  `,
                )}
              </div>
            </div>
          </div>
        </div>
        <div class="stack">
          ${this.isLeader
            ? html`<button
                type="button"
                class="start-game-button"
                @click=${this.startGame}
              >
                Start Game
              </button>`
            : html`<div>Waiting for leader to start...</div>`}
        </div>
      </div>
    `;
  }
}
