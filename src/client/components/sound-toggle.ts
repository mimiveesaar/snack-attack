import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { soundManager } from '@client/utils/sound-manager';

@customElement('sound-toggle')
export class SoundToggle extends LitElement {
  @state() private soundEnabled = soundManager.isSoundEnabled();

  private onToggleSound(): void {
    this.soundEnabled = soundManager.toggleSound();
  }

  render() {
    const icon = this.soundEnabled ? '🔊' : '🔇';
    const label = this.soundEnabled ? 'Sound On' : 'Sound Off';

    return html`
      <div class="wrapper">
        <button
          class="sound-toggle ${!this.soundEnabled ? 'sound-off' : ''}"
          @click=${this.onToggleSound}
          title="${label}"
          aria-label="${label}"
        >
          ${icon}
          <span class="tooltip">${label}</span>
        </button>
      </div>
    `;
  }

  createRenderRoot() {
    return this; 
  }
}
