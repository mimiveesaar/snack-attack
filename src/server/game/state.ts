import { GameState, GamePlayer, GameLeaderboardEntry } from "../../shared/game";


export interface Vec2D {
  x: number;
  y: number;
}

export interface GamePlayerInit {
  id: string;
  nicknameDisplay: string;
  color: string;
  isLeader?: boolean;
}

/**
 * GameSessionState manages the authoritative game state for a single game session.
 * This is the single source of truth for all game logic.
 */
export class GameSessionState {
  private state: GameState;

  constructor(sessionId: string, lobbyId: string, players: GamePlayerInit[]) {
    const gamePlayers: GamePlayer[] = players.map((p, idx) => ({
      id: p.id,
      nicknameDisplay: p.nicknameDisplay,
      color: p.color,
      isLeader: p.isLeader || idx === 0,
      position: { x: 250 + (idx % 2) * 50, y: 250 + Math.floor(idx / 2) * 50 },
      velocity: { x: 0, y: 0 },
      xp: 0,
      growthPhase: 1,
      collisionRadius: 12,
      visualSize: 1.0,
      status: 'alive' as const,
      respawnTimeMs: null,
      graceEndTimeMs: null,
      powerups: [],
      powerupEndTimes: new Map(),
      lastInputTick: 0,
      inputQueue: [],
    }));

    this.state = {
      sessionId,
      lobbyId,
      createdAt: Date.now(),
      startedAt: Date.now(),
      status: 'active',
      timerStartMs: Date.now(),
      gameTimerDurationMs: 2 * 60 * 1000, // 2 minutes
      isPaused: false,
      pausedByLeaderId: null,
      serverTick: 0,
      players: gamePlayers,
      npcs: [],
      powerups: [],
      leaderboard: this.computeLeaderboard(gamePlayers),
    };
  }

  /**
   * Compute growth phase from XP
   */
  private getGrowthPhase(xp: number): 1 | 2 | 3 {
    if (xp < 50) return 1;
    if (xp < 150) return 2;
    return 3;
  }

  /**
   * Compute collision radius for a player's growth phase
   */
  private getCollisionRadius(phase: 1 | 2 | 3): number {
    const radiusMap: Record<1 | 2 | 3, number> = {
      1: 12,
      2: 18,
      3: 24,
    };
    return radiusMap[phase];
  }

  /**
   * Compute visual size for a player's growth phase
   */
  private getVisualSize(phase: 1 | 2 | 3): number {
    const sizeMap: Record<1 | 2 | 3, number> = {
      1: 0.45, // Smaller than before (was 0.5)
      2: 0.65, // Smaller than before (was 0.7)
      3: 0.85, // Smaller than before (was 0.95)
    };
    return sizeMap[phase];
  }

  /**
   * Update player XP and recalculate growth phase
   */
  updatePlayerXp(playerId: string, xpDelta: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.xp += xpDelta;
    const newPhase = this.getGrowthPhase(player.xp);
    if (newPhase !== player.growthPhase) {
      player.growthPhase = newPhase;
      player.collisionRadius = this.getCollisionRadius(newPhase);
      player.visualSize = this.getVisualSize(newPhase);
    }
    return true;
  }

  /**
   * Set player respawn state
   */
  setPlayerRespawning(playerId: string, respawnDelayMs: number = 2000): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.status = 'respawning';
    player.respawnTimeMs = Date.now() + respawnDelayMs;
    player.graceEndTimeMs = player.respawnTimeMs + 2000; // 2s grace period after respawn
    player.xp = 0;
    player.growthPhase = 1 as const;
    player.collisionRadius = this.getCollisionRadius(1);
    player.visualSize = this.getVisualSize(1);
    player.powerups = [];
    player.powerupEndTimes.clear();
    return true;
  }

  /**
   * Complete player respawn at new position
   */
  completePlayerRespawn(playerId: string, newPosition: Vec2D): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.status = 'alive';
    player.position = newPosition;
    player.velocity = { x: 0, y: 0 };
    player.respawnTimeMs = null;
    return true;
  }

  /**
   * Check if player is in grace period (can't be eaten)
   */
  isPlayerInGrace(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.graceEndTimeMs) return false;
    return Date.now() < player.graceEndTimeMs;
  }

  /**
   * Add power-up to player
   */
  addPowerup(playerId: string, powerupType: 'speed-boost' | 'double-xp', durationMs: number = 10000): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    // Remove old powerup of same type if exists
    const idx = player.powerups.indexOf(powerupType);
    if (idx >= 0) {
      player.powerups.splice(idx, 1);
    }

    player.powerups.push(powerupType);
    player.powerupEndTimes.set(powerupType, Date.now() + durationMs);
    return true;
  }

  /**
   * Remove power-up from player
   */
  removePowerup(playerId: string, powerupType: 'speed-boost' | 'double-xp'): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    const idx = player.powerups.indexOf(powerupType);
    if (idx >= 0) {
      player.powerups.splice(idx, 1);
      player.powerupEndTimes.delete(powerupType);
      return true;
    }
    return false;
  }

  /**
   * Compute leaderboard from current player states
   */
  private computeLeaderboard(players: GamePlayer[]): GameLeaderboardEntry[] {
    return players
      .map((p) => ({
        id: p.id,
        nicknameDisplay: p.nicknameDisplay,
        xp: p.xp,
        isLeader: p.isLeader,
        status: p.status,
      }))
      .sort((a, b) => b.xp - a.xp);
  }

  /**
   * Apply player input direction
   */
  applyPlayerInput(playerId: string, direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 }): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || player.status !== 'alive') return false;

    const PLAYER_SPEED = 200; // pixels per second
    const speedMultiplier = player.powerups.includes('speed-boost') ? 1.5 : 1.0;
    const speed = PLAYER_SPEED * speedMultiplier;

    // Set velocity based on direction
    if (direction.x !== 0 || direction.y !== 0) {
      // Normalize diagonal movement
      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      player.velocity.x = (direction.x / magnitude) * (speed / 1000); // Convert to pixels per ms
      player.velocity.y = (direction.y / magnitude) * (speed / 1000);
    } else {
      // Stop moving
      player.velocity.x = 0;
      player.velocity.y = 0;
    }

    return true;
  }

  /**
   * Recompute and update leaderboard
   */
  updateLeaderboard(): GameLeaderboardEntry[] {
    this.state.leaderboard = this.computeLeaderboard(this.state.players);
    return this.state.leaderboard;
  }

  /**
   * Get current game state (snapshot)
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Update server tick counter
   */
  incrementTick(): void {
    this.state.serverTick++;
  }

  /**
   * Update game timer (called every tick)
   */
  updateTimer(): void {
    // Timer update logic is handled by the loop checking getTimeRemainingMs()
    // This method is kept for compatibility but doesn't need to set status
    // Status is set in the game loop to ensure proper game end handling
  }

  /**
   * Get time remaining in milliseconds
   */
  getTimeRemainingMs(): number {
    if (this.state.status === 'ended') return 0;
    const elapsed = Date.now() - this.state.timerStartMs;
    return Math.max(0, this.state.gameTimerDurationMs - elapsed);
  }

  /**
   * Pause game
   */
  pauseGame(leaderId: string): boolean {
    if (this.state.isPaused) return false;
    this.state.isPaused = true;
    this.state.pausedByLeaderId = leaderId;
    return true;
  }

  /**
   * Resume game
   */
  resumeGame(): boolean {
    if (!this.state.isPaused) return false;
    this.state.isPaused = false;
    this.state.pausedByLeaderId = null;
    return true;
  }

  /**
   * Mark player as quit
   */
  markPlayerQuit(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;
    player.status = 'spectating';
    return true;
  }
}

/**
 * Global game session store (in-memory)
 */
const sessionStore = new Map<string, GameSessionState>();

export function createGameSession(sessionId: string, lobbyId: string, players: GamePlayerInit[]): GameSessionState {
  const session = new GameSessionState(sessionId, lobbyId, players);
  sessionStore.set(sessionId, session);
  return session;
}

export function getGameSession(sessionId: string): GameSessionState | undefined {
  return sessionStore.get(sessionId);
}

export function deleteGameSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function getAllGameSessions(): Map<string, GameSessionState> {
  return sessionStore;
}
