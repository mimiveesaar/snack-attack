export type UpdateCallback = (deltaSeconds: number) => void;
export type RenderCallback = (alpha: number) => void;

export interface GameLoopOptions {
  fixedDeltaSeconds: number;
  maxStepsPerFrame: number;
  maxFrameDeltaSeconds: number;
}

export class GameLoop {
  private accumulatorSeconds = 0;
  private lastFrameTimeMs = 0;
  private running = false;
  private rafId: number | null = null;
  private updateCallback: UpdateCallback | null = null;
  private renderCallback: RenderCallback | null = null;

  constructor(private readonly options: GameLoopOptions) {}

  start(update: UpdateCallback, render: RenderCallback) {
    if (this.running) {
      return;
    }
    this.updateCallback = update;
    this.renderCallback = render;
    this.running = true;
    this.lastFrameTimeMs = performance.now();
    this.rafId = window.requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.accumulatorSeconds = 0;
  }

  private tick = (timeMs: number) => {
    if (!this.running || !this.updateCallback || !this.renderCallback) {
      return;
    }

    const frameDeltaSeconds = Math.min(
      (timeMs - this.lastFrameTimeMs) / 1000,
      this.options.maxFrameDeltaSeconds,
    );
    this.lastFrameTimeMs = timeMs;
    this.accumulatorSeconds += frameDeltaSeconds;

    let steps = 0;
    while (
      this.accumulatorSeconds >= this.options.fixedDeltaSeconds &&
      steps < this.options.maxStepsPerFrame
    ) {
      this.updateCallback(this.options.fixedDeltaSeconds);
      this.accumulatorSeconds -= this.options.fixedDeltaSeconds;
      steps += 1;
    }

    const alpha = this.options.fixedDeltaSeconds > 0
      ? this.accumulatorSeconds / this.options.fixedDeltaSeconds
      : 0;
    this.renderCallback(alpha);

    this.rafId = window.requestAnimationFrame(this.tick);
  };
}
