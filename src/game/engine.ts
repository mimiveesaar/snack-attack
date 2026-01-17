/**
 * Game Engine: Core gameplay logic and state management
 * Handles game loop, collision detection, scoring, and game lifecycle.
 */

import type { GameState, PlayerGameState, GameInput, GameUpdate, GameEvent, GameResult } from '@shared/types';
import type { LeaderboardEntry } from '@shared/types';

export class GameEngine {
  private sessionId: string;
  private lobbyId: string;
  private gameState: GameState;
  private playerStates: Map<string, PlayerGameState> = new Map();
  private gameEvents: GameEvent[] = [];
  private startTimeMs: number = 0;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private readonly TICK_RATE_MS = 1000 / 60; // 60 FPS

  constructor(gameState: GameState) {
    this.sessionId = gameState.sessionId;
    this.lobbyId = gameState.lobbyId;
    this.gameState = gameState;
    this.startTimeMs = Date.now();
    this.initializePlayerStates();
  }

  private initializePlayerStates(): void {
    this.gameState.players.forEach((player, index) => {
      this.playerStates.set(player.id, {
        playerId: player.id,
        nicknameDisplay: player.nicknameDisplay,
        color: player.color,
        score: 0,
        isAlive: true,
        positionX: 50 + index * 50, // Simple initial spacing
        positionY: 250,
        ready: true,
      });
    });
  }

  /**
   * Start the game loop
   */
  public start(): void {
    this.gameLoopInterval = setInterval(() => this.tick(), this.TICK_RATE_MS);
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  /**
   * Process a player input
   */
  public handleInput(input: GameInput): void {
    const playerState = this.playerStates.get(input.playerId);
    if (!playerState) return;

    if (input.direction) {
      this.movePlayer(playerState, input.direction);
    }
    if (input.action) {
      this.executeAction(playerState, input.action);
    }
  }

  /**
   * Main game loop tick
   */
  private tick(): void {
    this.updatePhysics();
    this.checkCollisions();
    this.updateLeaderboard();
    this.gameEvents = []; // Clear events after processing
  }

  private movePlayer(state: PlayerGameState, direction: string): void {
    const SPEED = 5;
    switch (direction) {
      case 'up':
        state.positionY = Math.max(0, state.positionY - SPEED);
        break;
      case 'down':
        state.positionY = Math.min(500, state.positionY + SPEED);
        break;
      case 'left':
        state.positionX = Math.max(0, state.positionX - SPEED);
        break;
      case 'right':
        state.positionX = Math.min(500, state.positionX + SPEED);
        break;
    }
  }

  private executeAction(state: PlayerGameState, action: string): void {
    if (action === 'fire') {
      this.gameEvents.push({
        type: 'custom',
        playerId: state.playerId,
        timestamp: Date.now(),
        data: { actionType: 'fire' },
      });
    }
  }

  private updatePhysics(): void {
    // Placeholder for physics updates
  }

  private checkCollisions(): void {
    // Placeholder for collision detection
  }

  private updateLeaderboard(): void {
    const leaderboard: LeaderboardEntry[] = Array.from(this.playerStates.values())
      .filter((p) => p.isAlive)
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.playerId,
        nicknameDisplay: p.nicknameDisplay,
        score: p.score,
      }));

    this.gameState.leaderboard = leaderboard;
  }

  /**
   * Get current game update to broadcast to clients
   */
  public getGameUpdate(): GameUpdate {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      players: Array.from(this.playerStates.values()),
      leaderboard: this.gameState.leaderboard,
      timerRemainingMs: this.gameState.timerRemainingMs,
      events: [...this.gameEvents],
    };
  }

  /**
   * End the game and compute final result
   */
  public endGame(): GameResult {
    this.stop();
    const durationMs = Date.now() - this.startTimeMs;

    const leaderboard: LeaderboardEntry[] = Array.from(this.playerStates.values())
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.playerId,
        nicknameDisplay: p.nicknameDisplay,
        score: p.score,
      }));

    return {
      sessionId: this.sessionId,
      lobbyId: this.lobbyId,
      leaderboard,
      winner: leaderboard[0] || null,
      totalDurationMs: durationMs,
    };
  }

  /**
   * Get current game state snapshot
   */
  public getGameState(): GameState {
    return this.gameState;
  }
}
