import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { OpponentColor, OpponentSlot } from "@shared/types";

const COLOR_OPTIONS: OpponentColor[] = ["red", "blue", "green", "orange"];

@customElement("opponent-overlay")
export class OpponentOverlay extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ attribute: false }) opponents: OpponentSlot[] = [];
  @property({ type: Boolean }) canEdit = true;

  @state() private draft: OpponentSlot[] = [];
  @state() private initialized = false;

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      display: none;
      z-index: 120;
    }

    :host([open]) {
      display: block;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .panel {
      width: min(520px, 90vw);
      background: #f7f7f0;
      border: 2px solid var(--border);
      border-radius: 10px;
      box-shadow:
        -4px 6px 0 var(--accent-dark),
        0 10px 18px var(--shadow);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 24px;
    }

    .close-btn {
      border: 2px solid var(--border);
      background: #8d9e8e;
      font-size: 16px;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow:
        -2px 3px 0 var(--accent-dark),
        0 6px 12px var(--shadow);
    }

    .slots {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slot {
      display: grid;
      grid-template-columns: 28px 1fr 120px auto;
      gap: 10px;
      align-items: center;
      padding: 10px;
      border: 2px solid var(--border);
      border-radius: 8px;
      background: #ffffff;
    }

    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid #222;
    }

    .slot input {
      font-family: "Jersey 10", system-ui, sans-serif;
      font-size: 16px;
      padding: 6px 8px;
      border-radius: 6px;
      border: 2px solid var(--border);
    }

    .slot select {
      font-family: "Jersey 10", system-ui, sans-serif;
      font-size: 16px;
      padding: 6px 8px;
      border-radius: 6px;
      border: 2px solid var(--border);
      background: #f6f1e5;
      cursor: pointer;
    }

    .slot button.remove {
      border: 2px solid var(--border);
      background: #f2c94c;
      font-size: 14px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .actions button {
      font-family: "Jersey 10", system-ui, sans-serif;
      font-size: 16px;
      border: 2px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      background: #8d9e8e;
      box-shadow:
        -2px 3px 0 var(--accent-dark),
        0 6px 12px var(--shadow);
    }

    .actions button[disabled],
    .slot button[disabled],
    .slot input[disabled],
    .slot select[disabled] {
      cursor: not-allowed;
      opacity: 0.6;
      box-shadow: none;
      filter: grayscale(0.6);
    }

    .empty-state {
      font-size: 14px;
      color: #555;
    }
  `;

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has("opponents")) {
      this.draft = this.opponents.map((slot) => ({ ...slot }));
    }

    if (changed.has("open")) {
      if (this.open) {
        if (!this.initialized) {
          this.initialized = true;
          if (this.draft.length === 0) {
            this.addDefaultSlot();
          }
        }
      } else {
        this.initialized = false;
      }
    }
  }

  private emitChange(next: OpponentSlot[]) {
    this.draft = next;
    this.dispatchEvent(
      new CustomEvent("opponents-change", {
        detail: { opponents: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private addDefaultSlot() {
    const next = [...this.draft];
    if (!next.some((slot) => slot.slotId === 1)) {
      next.push({
        slotId: 1,
        name: "Opponent 1",
        color: "red",
        isActive: true,
      });
    }
    this.emitChange(next);
  }

  private getNextSlotId(existing: OpponentSlot[]): number | null {
    for (let id = 1; id <= 3; id += 1) {
      if (!existing.some((slot) => slot.slotId === id)) return id;
    }
    return null;
  }

  private handleAddSlot() {
    if (!this.canEdit) return;
    const nextId = this.getNextSlotId(this.draft);
    if (!nextId) return;
    const next = [
      ...this.draft,
      {
        slotId: nextId,
        name: `Opponent ${nextId}`,
        color: COLOR_OPTIONS[(nextId - 1) % COLOR_OPTIONS.length],
        isActive: true,
      },
    ];
    this.emitChange(next);
  }

  private handleRemoveSlot(slotId: number) {
    if (!this.canEdit) return;
    const next = this.draft.filter((slot) => slot.slotId !== slotId);
    this.emitChange(next);
  }

  private handleNameChange(slotId: number, value: string) {
    const next = this.draft.map((slot) =>
      slot.slotId === slotId
        ? { ...slot, name: value }
        : slot,
    );
    this.emitChange(next);
  }

  private handleNameBlur(slotId: number, value: string) {
    const trimmed = value.trim();
    const next = this.draft.map((slot) => {
      if (slot.slotId !== slotId) return slot;
      return {
        ...slot,
        name: trimmed.length > 0 ? trimmed : `Opponent ${slotId}`,
      };
    });
    this.emitChange(next);
  }

  private handleColorChange(slotId: number, value: OpponentColor) {
    const next = this.draft.map((slot) =>
      slot.slotId === slotId
        ? { ...slot, color: value }
        : slot,
    );
    this.emitChange(next);
  }

  private closeOverlay() {
    this.dispatchEvent(
      new CustomEvent("overlay-close", { bubbles: true, composed: true }),
    );
  }

  render() {
    if (!this.open) return html``;
    const hasSlots = this.draft.length > 0;
    const addDisabled = !this.canEdit || this.draft.length >= 3;

    return html`
      <div class="backdrop" @click=${this.closeOverlay}>
        <div class="panel" @click=${(event: Event) => event.stopPropagation()}>
          <div class="header">
            <span>Manage Opponents</span>
            <button class="close-btn" type="button" @click=${this.closeOverlay}>
              ✕
            </button>
          </div>

          <div class="slots">
            ${hasSlots
              ? this.draft.map(
                  (slot) => html`
                    <div class="slot">
                      <div class="swatch" style="background: ${slot.color}"></div>
                      <input
                        type="text"
                        .value=${slot.name}
                        ?disabled=${!this.canEdit}
                        @input=${(event: Event) =>
                          this.handleNameChange(
                            slot.slotId,
                            (event.target as HTMLInputElement).value,
                          )}
                        @blur=${(event: Event) =>
                          this.handleNameBlur(
                            slot.slotId,
                            (event.target as HTMLInputElement).value,
                          )}
                      />
                      <select
                        .value=${slot.color}
                        ?disabled=${!this.canEdit}
                        @change=${(event: Event) =>
                          this.handleColorChange(
                            slot.slotId,
                            (event.target as HTMLSelectElement)
                              .value as OpponentColor,
                          )}
                      >
                        ${COLOR_OPTIONS.map(
                          (color) => html`
                            <option value=${color}>
                              ${color[0].toUpperCase() + color.slice(1)}
                            </option>
                          `,
                        )}
                      </select>
                      <button
                        type="button"
                        class="remove"
                        ?disabled=${!this.canEdit}
                        @click=${() => this.handleRemoveSlot(slot.slotId)}
                      >
                        Remove
                      </button>
                    </div>
                  `,
                )
              : html`<div class="empty-state">No opponents selected.</div>`}
          </div>

          <div class="actions">
            <button type="button" @click=${this.handleAddSlot} ?disabled=${addDisabled}>
              Add Opponent
            </button>
            <button type="button" @click=${this.closeOverlay}>
              Done
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
