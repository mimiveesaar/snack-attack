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
  private pendingEvents: any[] = [];

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
      collisionRadius: 7.5, // Phase 1 collision radius
      visualSize: 0.45,     // Phase 1 visual size
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
      gameTimerDurationMs: 30 * 1000,
      isPaused: false,
      pausedByLeaderId: null,
      pausedAt: null,
      pausedElapsedMs: 0,
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
      1: 7,  // Bigger than pink (6), smaller than grey (9)
      2: 10, // Bigger than grey (9), smaller than brown (12)
      3: 13, // Bigger than brown (12), but not too much
    };
    return radiusMap[phase];
  }

  /**
   * Compute visual size for a player's growth phase
   */
  private getVisualSize(phase: 1 | 2 | 3): number {
    const sizeMap: Record<1 | 2 | 3, number> = {
      1: 0, // Smaller than before (was 0.5)
      2: 0, // Smaller than before (was 0.7)
      3: 0, // Smaller than before (was 0.95)
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
   * Add power-up to player (replaces any existing powerup)
   */
  addPowerup(playerId: string, powerupType: 'speed-boost' | 'double-xp' | 'invincibility', durationMs: number = 10000): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    // Remove all existing powerups (only one active at a time)
    player.powerupEndTimes.clear();
    player.powerups = [];

    // Add new powerup
    player.powerups.push(powerupType);
    player.powerupEndTimes.set(powerupType, Date.now() + durationMs);
    return true;
  }

  /**
   * Remove power-up from player
   */
  removePowerup(playerId: string, powerupType: 'speed-boost' | 'double-xp' | 'invincibility'): boolean {
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
   * Clean up expired powerups for all players
   */
  cleanupExpiredPowerups(): void {
    const now = Date.now();
    for (const player of this.state.players) {
      const toRemove: ('speed-boost' | 'double-xp' | 'invincibility')[] = [];
      
      for (const [powerupType, endTime] of player.powerupEndTimes) {
        if (now >= endTime) {
          toRemove.push(powerupType as 'speed-boost' | 'double-xp' | 'invincibility');
        }
      }
      
      for (const powerupType of toRemove) {
        this.removePowerup(player.id, powerupType);
      }
    }
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
   * Queue events for next broadcast
   */
  queueEvents(events: any[]): void {
    if (!events.length) return;
    this.pendingEvents.push(...events);
  }

  /**
   * Drain queued events
   */
  drainEvents(): any[] {
    const queued = this.pendingEvents;
    this.pendingEvents = [];
    return queued;
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
    
    let elapsed: number;
    if (this.state.isPaused && this.state.pausedAt) {
      // If currently paused, freeze at the time when pause started
      // Calculate elapsed time up to pause point, excluding all previous paused time
      elapsed = (this.state.pausedAt - this.state.timerStartMs) - this.state.pausedElapsedMs;
    } else {
      // If not paused, use current time minus all paused time (including current session if any)
      elapsed = (Date.now() - this.state.timerStartMs) - this.state.pausedElapsedMs;
    }
    
    const remaining = Math.max(0, this.state.gameTimerDurationMs - elapsed);
    return remaining;
  }

  /**
   * Pause game
   */
  pauseGame(leaderId: string): boolean {
    if (this.state.isPaused) return false;
    console.log(`[PAUSE] Game paused by leader ${leaderId} at ${Date.now()}, pausedElapsedMs: ${this.state.pausedElapsedMs}`);
    this.state.isPaused = true;
    this.state.pausedByLeaderId = leaderId;
    this.state.pausedAt = Date.now();
    return true;
  }

  /**
   * Resume game
   */
  resumeGame(): boolean {
    if (!this.state.isPaused) return false;
    
    // Add the duration of this pause to total paused time
    if (this.state.pausedAt) {
      const pauseDuration = Date.now() - this.state.pausedAt;
      this.state.pausedElapsedMs += pauseDuration;
      console.log(`[PAUSE] Game resumed. Pause duration: ${pauseDuration}ms, total paused: ${this.state.pausedElapsedMs}ms`);
    }
    
    this.state.isPaused = false;
    this.state.pausedByLeaderId = null;
    this.state.pausedAt = null;
    return true;
  }

  /**
   * Mark player as quit
   */
  markPlayerQuit(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;
    player.status = 'quit';
    player.velocity.x = 0;
    player.velocity.y = 0;
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
