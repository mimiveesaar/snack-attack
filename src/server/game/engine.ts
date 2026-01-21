import { performance } from 'perf_hooks';

export type TickHandler = () => void;

export class FixedStepEngine {
  private readonly tickIntervalMs: number;
  private readonly maxCatchUpTicks: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private running = false;
  private nextTickTimeMs = 0;
  private onTick: TickHandler | null = null;

  constructor(tickIntervalMs: number, maxCatchUpTicks = 5) {
    this.tickIntervalMs = tickIntervalMs;
    this.maxCatchUpTicks = maxCatchUpTicks;
  }

  start(onTick: TickHandler): void {
    if (this.running) return;

    this.running = true;
    this.onTick = onTick;
    this.nextTickTimeMs = performance.now();

    const scheduleNext = () => {
      if (!this.running || !this.onTick) return;

      const now = performance.now();
      const delay = Math.max(0, this.nextTickTimeMs - now);

      this.timeoutId = setTimeout(() => {
        if (!this.running || !this.onTick) return;

        const current = performance.now();
        let ticks = 0;

        while (current >= this.nextTickTimeMs && ticks < this.maxCatchUpTicks) {
          this.onTick();
          this.nextTickTimeMs += this.tickIntervalMs;
          ticks += 1;
        }

        if (current >= this.nextTickTimeMs) {
          this.nextTickTimeMs = current + this.tickIntervalMs;
        }

        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.onTick = null;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}