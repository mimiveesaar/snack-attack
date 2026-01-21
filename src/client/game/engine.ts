/**
 * Client Game Engine - Main game loop using requestAnimationFrame
 *
 * Responsibilities:
 * - Tick at ~60 FPS using requestAnimationFrame
 * - Collect input and send to server
 * - Update local state from server broadcasts
 * - Call render callbacks
 */

import { getInputController } from './input-controller';

export interface EngineTickListener {
  onTick(deltaMs: number, tickNumber: number): void;
}

export class GameEngine {
  private tickRate: number = 60;
  private lastTickTimeMs: number = 0;
  private tickNumber: number = 0;
  private running: boolean = false;
  private animationFrameId: number | null = null;
  private listeners: Set<EngineTickListener> = new Set();

  constructor(tickRate: number = 60) {
    this.tickRate = tickRate;
  }

  start(): void {
    if (this.running) return;

    console.log(`GameEngine: Starting at ${this.tickRate} FPS`);
    this.running = true;
    this.lastTickTimeMs = Date.now();
    this.tickNumber = 0;
    this.tick();
  }

  stop(): void {
    if (!this.running) return;

    console.log('GameEngine: Stopping');
    this.running = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;

    const nowMs = Date.now();
    const deltaMs = nowMs - this.lastTickTimeMs;
    this.lastTickTimeMs = nowMs;

    // Notify listeners of tick
    this.listeners.forEach((listener) => {
      listener.onTick(deltaMs, this.tickNumber);
    });

    this.tickNumber++;

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  onTick(listener: EngineTickListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentTick(): number {
    return this.tickNumber;
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

let engine: GameEngine | null = null;

export function getGameEngine(): GameEngine {
  if (!engine) {
    engine = new GameEngine(60);
  }
  return engine;
}

export function destroyGameEngine(): void {
  if (engine) {
    engine.destroy();
    engine = null;
  }
}
