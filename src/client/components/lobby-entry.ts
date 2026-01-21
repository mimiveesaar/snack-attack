import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  playerColors,
  colorToName,
  colorToFishAsset,
} from "@client/utils/colors";
import { validateNickname } from "@client/utils/validation";
import { soundManager } from "@client/utils/sound-manager";

@customElement("lobby-entry")
export class LobbyEntry extends LitElement {
  @property({ type: String }) mode: "create" | "join" = "create";
  @property({ type: String }) error: string | null = null;

  @state() private nickname = "";
  @state() private color: string | null = null;
  @state() private validationMessage: string | null = null;
  @state() private clickedColor: string | null = null;

  static styles = css`
    .fish-selection {
      display: flex;
      gap: 1rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .fish-button {
      background: #8d9e8e !important;
      border: 3px solid #ddd;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      min-width: 100px;
      font: inherit;
    }

    .fish-button:not(.selected) {
      opacity: 0.6;
    }

    .fish-button:hover {
      border-color: #999;
      background: #8d9e8e !important;
      transform: scale(1.05);
    }

    .fish-button.clicked {
      animation: clickPulse 0.3s ease;
    }

    @keyframes clickPulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(0.95);
        background: #81c784;
      }
      100% {
        transform: scale(1);
      }
    }

    .fish-button.selected {
      border: 4px solid #2e7d32;
      border-radius: 12px;
      background: #81c784;
      box-shadow:
        0 0 15px rgba(46, 125, 50, 0.4),
        inset 0 0 20px rgba(0, 0, 0, 0.05),
        0 8px 16px rgba(0, 0, 0, 0.15);
      transform: scale(1.15);
      position: relative;
    }

    .fish-button.selected::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-radius: 10px;
      pointer-events: none;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(0, 0, 0, 0);
      }
    }

    .fish-icon {
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
    }

    .fish-button.selected .fish-icon {
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.8) 0%,
        rgba(0, 0, 0, 0.05) 100%
      );
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 3px rgba(255, 255, 255, 0.5);
    }

    .fish-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
      transition: filter 0.3s ease;
    }

    .fish-button.selected .fish-icon img {
      filter: drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.25));
    }

    .fish-label {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      color: #666;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
      display: none;
    }

    .fish-button.selected .fish-label {
      display: block;
      color: #1b5e20;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .selected-indicator {
      font-size: 20px;
      font-weight: bold;
      margin-top: 0.25rem;
      color: #1b5e20;
      animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes scaleIn {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .panel {
      align-self: center;
    }
  `;

  createRenderRoot() {
    return this; // use light DOM to inherit global styles
  }

  private onSubmit(event: Event) {
    event.preventDefault();
    const validation = validateNickname(this.nickname.trim());
    if (!validation.valid) {
      this.validationMessage = validation.message ?? "Invalid nickname";
      return;
    }
    if (!this.color) {
      this.validationMessage = "Please choose a fish";
      return;
    }
    this.validationMessage = null;
    this.dispatchEvent(
      new CustomEvent("entry-submit", {
        detail: { nickname: this.nickname.trim(), color: this.color },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onColorChange(color: string) {
    this.color = color;
    this.clickedColor = color;
    soundManager.playFishSelectSound();

    // Remove clicked state after animation completes
    setTimeout(() => {
      this.clickedColor = null;
    }, 300);
  }

  private getFishAssetPath(color: string): string {
    const asset = colorToFishAsset[color] || "fish_green";
    return `/assets/vector/${asset}.svg`;
  }

  private getFishLabel(color: string): string {
    return colorToName[color] || "Fish";
  }

  render() {
    return html`
      <div class="panel stack">
        <h1>Snack Attack</h1>
        <form class="stack" @submit=${this.onSubmit}>
          <div>
            <label for="nickname">Nickname</label>
            <input
              id="nickname"
              type="text"
              autocomplete="off"
              .value=${this.nickname}
              @input=${(e: Event) =>
                (this.nickname = (e.target as HTMLInputElement).value)}
              placeholder="Enter nickname"
            />
            ${this.validationMessage
              ? html`<div class="inline-error">${this.validationMessage}</div>`
              : null}
            ${this.error
              ? html`<div class="inline-error">${this.error}</div>`
              : null}
          </div>

          <div class="stack">
            <label>Choose Your Fish</label>
            <div class="fish-selection">
              ${playerColors.map(
                (c) => html`
                  <button
                    type="button"
                    class="fish-button ${this.color === c
                      ? "selected"
                      : ""} ${this.clickedColor === c ? "clicked" : ""}"
                    @click=${() => this.onColorChange(c)}
                    title="Choose ${this.getFishLabel(c)} fish"
                  >
                    <div class="fish-icon">
                      <img
                        src="${this.getFishAssetPath(c)}"
                        alt="${this.getFishLabel(c)} fish"
                      />
                    </div>
                    <span class="fish-label">${this.getFishLabel(c)}</span>
                    ${this.color === c
                      ? html`<span class="selected-indicator">✓</span>`
                      : null}
                  </button>
                `,
              )}
            </div>
          </div>

          <button type="submit">
            ${this.mode === "create" ? "Create Lobby" : "Join Lobby"}
          </button>
        </form>
      </div>
    `;
  }
}
