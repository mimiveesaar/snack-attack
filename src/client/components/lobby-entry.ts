import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { playerColors, pickDefaultColor } from '@client/utils/colors';
import { validateNickname } from '@client/utils/validation';

@customElement('lobby-entry')
export class LobbyEntry extends LitElement {
  @property({ type: String }) mode: 'create' | 'join' = 'create';
  @property({ type: String }) error: string | null = null;

  @state() private nickname = '';
  @state() private color = pickDefaultColor();
  @state() private validationMessage: string | null = null;

  createRenderRoot() {
    return this; // use light DOM to inherit global styles
  }

  private onSubmit(event: Event) {
    event.preventDefault();
    const validation = validateNickname(this.nickname.trim());
    if (!validation.valid) {
      this.validationMessage = validation.message ?? 'Invalid nickname';
      return;
    }
    this.validationMessage = null;
    this.dispatchEvent(
      new CustomEvent('entry-submit', {
        detail: { nickname: this.nickname.trim(), color: this.color },
        bubbles: true,
        composed: true,
      })
    );
  }

  private onColorChange(color: string) {
    this.color = color;
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
              @input=${(e: Event) => (this.nickname = (e.target as HTMLInputElement).value)}
              placeholder="Enter nickname"
            />
            ${this.validationMessage ? html`<div class="inline-error">${this.validationMessage}</div>` : null}
            ${this.error ? html`<div class="inline-error">${this.error}</div>` : null}
          </div>

          <div class="stack">
            <label>Fish Color</label>
            <div class="row">
              ${playerColors.map(
                (c) => html`
                  <button
                    type="button"
                    class=${this.color === c ? '' : 'secondary'}
                    style="background:${c}; color:#000;"
                    @click=${() => this.onColorChange(c)}
                  >
                    ${this.color === c ? 'Selected' : 'Choose'}
                  </button>
                `
              )}
            </div>
          </div>

          <button type="submit">${this.mode === 'create' ? 'Create Lobby' : 'Join Lobby'}</button>
        </form>
      </div>
    `;
  }
}
