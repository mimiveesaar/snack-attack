/**
 * Game Engine: Core gameplay logic and state management
 * Handles game loop, collision detection, scoring, and game lifecycle.
 */

import { GameState, PlayerGameState, GameEvent, GameInput, GameUpdate, GameResult } from "../shared/game";
import { LeaderboardEntry } from "../shared/game-session";



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
    this.gameState.players.forEach((player: { id: string; nicknameDisplay: any; color: any; }, index: number) => {
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

  private movePlayer(state: PlayerGameState, direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 }): void {
    const SPEED = 5;
    state.positionX = Math.max(0, Math.min(500, state.positionX + direction.x * SPEED));
    state.positionY = Math.max(0, Math.min(500, state.positionY + direction.y * SPEED));
  }

  private updatePhysics(): void {
    // Placeholder for physics updates
  }

  private checkCollisions(): void {
    // Placeholder for collision detection
  }

  private updateLeaderboard(): void {
    const leaderboard = Array.from(this.playerStates.values())
      .filter((p) => p.isAlive)
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({
        id: p.playerId,
        nicknameDisplay: p.nicknameDisplay,
        xp: p.score,
        isLeader: idx === 0,
        status: p.isAlive ? ('alive' as const) : ('quit' as const),
      }));

    this.gameState.leaderboard = leaderboard;
  }

  /**
   * Get current game update to broadcast to clients
   */
  public getGameUpdate(): GameUpdate {
    const leaderboard = this.gameState.leaderboard.map((entry) => ({
      playerId: entry.id,
      nicknameDisplay: entry.nicknameDisplay,
      score: entry.xp,
    }));

    const elapsedMs = Date.now() - this.gameState.timerStartMs;
    const timerRemainingMs = Math.max(0, this.gameState.gameTimerDurationMs - elapsedMs);

    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      players: Array.from(this.playerStates.values()),
      leaderboard: leaderboard,
      timerRemainingMs: timerRemainingMs,
      events: [...this.gameEvents],
    };
  }

  /**
   * End the game and compute final result
   */
  public endGame(): GameResult {
    this.stop();
    const durationMs = Date.now() - this.startTimeMs;

    const leaderboard = Array.from(this.playerStates.values())
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
