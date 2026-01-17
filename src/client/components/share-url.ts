import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { copyToClipboard } from '@client/utils/clipboard';

@customElement('share-url')
export class ShareUrl extends LitElement {
  @property({ type: String }) url = '';
  @state() private feedback: string | null = null;

  createRenderRoot() {
    return this;
  }

  private async onCopy() {
    const result = await copyToClipboard(this.url);
    this.feedback = result.ok ? 'Link copied!' : result.error ?? 'Copy failed';
    this.dispatchEvent(
      new CustomEvent('share-feedback', {
        detail: { ok: result.ok, message: this.feedback },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="stack">
        <button type="button" @click=${this.onCopy}>Share URL</button>
        ${this.feedback ? html`<div class="clipboard-feedback">${this.feedback}</div>` : null}
      </div>
    `;
  }
}
