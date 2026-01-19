import type { Vec2 } from '@shared/types/vec2';

export interface PlayerInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const DEFAULT_INPUT: PlayerInputState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const KEY_MAP: Record<string, keyof PlayerInputState> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

export class PlayerController {
  private inputState: PlayerInputState = { ...DEFAULT_INPUT };
  private connected = false;

  connect() {
    if (this.connected) {
      return;
    }
    this.connected = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.resetInput);
  }

  disconnect() {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.resetInput);
    this.resetInput();
  }

  getInputState(): PlayerInputState {
    return { ...this.inputState };
  }

  getDirection(): Vec2 {
    const horizontal = Number(this.inputState.right) - Number(this.inputState.left);
    const vertical = Number(this.inputState.up) - Number(this.inputState.down);

    return {
      x: horizontal === 0 ? 0 : Math.sign(horizontal),
      y: vertical === 0 ? 0 : Math.sign(vertical),
    };
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const mapped = KEY_MAP[event.code];
    if (!mapped) {
      return;
    }
    this.inputState = { ...this.inputState, [mapped]: true };
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const mapped = KEY_MAP[event.code];
    if (!mapped) {
      return;
    }
    this.inputState = { ...this.inputState, [mapped]: false };
  };

  private resetInput = () => {
    this.inputState = { ...DEFAULT_INPUT };
  };
}
