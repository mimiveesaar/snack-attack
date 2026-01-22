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
  private soundActivated = false;

  private handleFirstInteraction = () => {
    if (this.soundActivated) return;
    this.soundActivated = true;
    if (!soundManager.isSoundEnabled()) {
      soundManager.toggleSound();
    }
  };

  createRenderRoot() {
    return this; // use light DOM to inherit global styles
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("pointerdown", this.handleFirstInteraction, {
      once: true,
      capture: true,
    });
  }

  disconnectedCallback(): void {
    this.removeEventListener("pointerdown", this.handleFirstInteraction, {
      capture: true,
    });
    super.disconnectedCallback();
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
      <div class="stack panel">
        <h1>Snack Attack!</h1>
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
            ${
              this.validationMessage
                ? html`<div class="inline-error">
                    ${this.validationMessage}
                  </div>`
                : null
            }
            ${
              this.error
                ? html`<div class="inline-error">${this.error}</div>`
                : null
            }
          </div>

          <div class="fish-selection-container">
            <label class="fish-selection-label">Choose Your Fish</label>
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

          <button type="submit" class="create-lobby-button">
            ${this.mode === "create" ? "Create Lobby" : "Join Lobby"}
          </button>
        </form>
        </div>
      </div>
    `;
  }
}
