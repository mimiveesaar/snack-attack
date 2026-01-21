export type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

export class InputController {
  private direction: Direction = { x: 0, y: 0 };
  private keysPressed: Set<string> = new Set();
  private listeners: Map<string, Set<(direction: Direction) => void>> = new Map();
  private readonly handleKeyDownBound: (e: KeyboardEvent) => void;
  private readonly handleKeyUpBound: (e: KeyboardEvent) => void;

  constructor() {
    this.handleKeyDownBound = (e) => this.handleKeyDown(e);
    this.handleKeyUpBound = (e) => this.handleKeyUp(e);
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    if (['arrowup', 'w'].includes(key)) {
      this.keysPressed.add('up');
      e.preventDefault();
    }
    if (['arrowdown', 's'].includes(key)) {
      this.keysPressed.add('down');
      e.preventDefault();
    }
    if (['arrowleft', 'a'].includes(key)) {
      this.keysPressed.add('left');
      e.preventDefault();
    }
    if (['arrowright', 'd'].includes(key)) {
      this.keysPressed.add('right');
      e.preventDefault();
    }

    this.updateDirection();
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    if (['arrowup', 'w'].includes(key)) {
      this.keysPressed.delete('up');
      e.preventDefault();
    }
    if (['arrowdown', 's'].includes(key)) {
      this.keysPressed.delete('down');
      e.preventDefault();
    }
    if (['arrowleft', 'a'].includes(key)) {
      this.keysPressed.delete('left');
      e.preventDefault();
    }
    if (['arrowright', 'd'].includes(key)) {
      this.keysPressed.delete('right');
      e.preventDefault();
    }

    this.updateDirection();
  }

  private updateDirection(): void {
    const newDirection: Direction = { x: 0, y: 0 };

    if (this.keysPressed.has('left')) newDirection.x = -1;
    if (this.keysPressed.has('right')) newDirection.x = 1;
    if (this.keysPressed.has('up')) newDirection.y = -1;
    if (this.keysPressed.has('down')) newDirection.y = 1;

    this.direction = newDirection;
    this.notifyListeners();
  }

  getDirection(): Direction {
    return this.direction;
  }

  onDirectionChange(callback: (direction: Direction) => void): () => void {
    if (!this.listeners.has('change')) {
      this.listeners.set('change', new Set());
    }
    this.listeners.get('change')!.add(callback);

    return () => {
      this.listeners.get('change')?.delete(callback);
    };
  }

  private notifyListeners(): void {
    const callbacks = this.listeners.get('change') || new Set();
    callbacks.forEach((cb) => cb(this.direction));
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);
    this.listeners.clear();
    this.keysPressed.clear();
    this.direction = { x: 0, y: 0 };
  }
}

let inputController: InputController | null = null;

export function getInputController(): InputController {
  if (!inputController) {
    inputController = new InputController();
  }
  return inputController;
}

export function destroyInputController(): void {
  if (inputController) {
    inputController.destroy();
    inputController = null;
  }
}
