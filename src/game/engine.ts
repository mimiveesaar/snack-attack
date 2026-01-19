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
  private nextPowerupSpawnMs: number = 0;

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
    this.scheduleNextPowerup();
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
    console.log('[GameEngine] tick');
    this.updatePhysics();
    this.spawnPowerups();
    this.checkCollisions();
    this.updateLeaderboard();
    this.gameEvents = []; // Clear events after processing

  }

  private spawnPowerups(): void {
    const now = Date.now();
    if (!this.gameState.powerups) this.gameState.powerups = [];
    // Clean up old powerups (collected or despawning for >10s)
    this.gameState.powerups = this.gameState.powerups.filter(p => p.status === 'available' || (now - p.spawnTimeMs < 10000));

    if (now < this.nextPowerupSpawnMs) {
      // Not time to spawn yet
      return;
    }

    // Randomly choose a powerup type
    const types = ['invincibility', 'speed-boost', 'double-xp'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    // Random position within bounds
    const x = 50 + Math.random() * 400;
    const y = 50 + Math.random() * 400;
    const powerup = {
      id: 'powerup-' + Math.random().toString(36).substr(2, 9),
      type,
      position: { x, y },
      collisionRadius: 25,
      spawnTimeMs: now,
      status: 'available',
    };
    this.gameState.powerups.push(powerup);
    this.scheduleNextPowerup();
    console.log('[Powerup] Spawned:', powerup);
    console.log('[Powerup] All powerups:', this.gameState.powerups);
  }

  private scheduleNextPowerup(): void {
    // Next spawn in 5-15 seconds
    const interval = 5000;
    this.nextPowerupSpawnMs = Date.now() + interval;
    console.log('[Powerup] Next powerup scheduled in', Math.round(interval / 1000), 'seconds');
  }

  private movePlayer(state: PlayerGameState, direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 }): void {
    let SPEED = 5;
    if (state.activePowerup === 'speed-boost' && state.powerupEndTimeMs && state.powerupEndTimeMs > Date.now()) {
      SPEED = 10;
    }
    state.positionX = Math.max(0, Math.min(500, state.positionX + direction.x * SPEED));
    state.positionY = Math.max(0, Math.min(500, state.positionY + direction.y * SPEED));
  }

  private updatePhysics(): void {
    // Placeholder for physics updates
  }

  private checkCollisions(): void {
    // Player vs Player collision
    const players = Array.from(this.playerStates.values());
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];
        if (!p1.isAlive || !p2.isAlive) continue;
        // Simple collision check (distance < threshold)
        const dx = p1.positionX - p2.positionX;
        const dy = p1.positionY - p2.positionY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const COLLISION_RADIUS = 30;
        if (dist < COLLISION_RADIUS) {
          // Check invincibility
          const now = Date.now();
          const p1Inv = p1.activePowerup === 'invincibility' && p1.powerupEndTimeMs && p1.powerupEndTimeMs > now;
          const p2Inv = p2.activePowerup === 'invincibility' && p2.powerupEndTimeMs && p2.powerupEndTimeMs > now;
          if (p1Inv || p2Inv) continue;
          if (p1.score > p2.score) {
            p1.score += p2.score;
            p2.score = 0;
            p2.isAlive = false;
            // Respawn logic
            setTimeout(() => {
              p2.isAlive = true;
              p2.positionX = 50;
              p2.positionY = 250;
            }, 1000);
          } else if (p2.score > p1.score) {
            p2.score += p1.score;
            p1.score = 0;
            p1.isAlive = false;
            setTimeout(() => {
              p1.isAlive = true;
              p1.positionX = 50;
              p1.positionY = 250;
            }, 1000);
          }
        }
      }
    }

    // Player vs Powerup collision
    for (const player of players) {
      if (!player.isAlive) continue;
      for (const powerup of this.gameState.powerups) {
        if (powerup.status !== 'available') continue;
        const dx = player.positionX - powerup.position.x;
        const dy = player.positionY - powerup.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (powerup.collisionRadius || 30)) {
          // Assign powerup
          player.activePowerup = powerup.type;
          player.powerupEndTimeMs = Date.now() + 10000;
          // Mark powerup as collected
          powerup.status = 'collected';
        }
      }
      // Expire powerup
      if (player.activePowerup && player.powerupEndTimeMs && player.powerupEndTimeMs < Date.now()) {
        player.activePowerup = undefined;
        player.powerupEndTimeMs = undefined;
      }
    }
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
