/**
 * Sound Toggle Button - Component for toggling sound on/off
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { soundManager } from '@client/utils/sound-manager';

@customElement('sound-toggle')
export class SoundToggle extends LitElement {
  @state() private soundEnabled = soundManager.isSoundEnabled();

  static styles = css`
    .sound-toggle {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 24px;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;
      width: 44px;
      height: 44px;
      pointer-events: auto;
      z-index: 9999;
    }

    .sound-toggle:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: scale(1.1);
    }

    .sound-toggle:active {
      transform: scale(0.95);
    }

    .sound-toggle.sound-off {
      opacity: 0.6;
    }

    .tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-0.5rem);
    }

    .sound-toggle:hover .tooltip {
      opacity: 1;
    }

    .wrapper {
      position: relative;
      display: inline-block;
      pointer-events: auto;
    }
  `;

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
