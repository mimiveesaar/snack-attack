import type { Difficulty } from "../../shared/lobby";
import type { GameState, GamePlayer, GameLeaderboardEntry, Vec2D } from "../../shared/game";
import { PLAYER_GROWTH_CONFIG, SESSION_DURATION_MS } from "../../shared/config";

export interface GamePlayerInit {
  id: string;
  nicknameDisplay: string;
  color: string;
  isLeader?: boolean;
  isBot?: boolean;
}

/**
 * GameSessionState manages the authoritative game state for a single game session.
 * This is the single source of truth for all game logic.
 */
export class GameSessionState {
  private state: GameState;
  private pendingEvents: any[] = [];


  constructor(sessionId: string, lobbyId: string, players: GamePlayerInit[], difficulty: Difficulty) {
    const gamePlayers: GamePlayer[] = players.map((p, idx) => ({
      id: p.id,
      nicknameDisplay: p.nicknameDisplay,
      color: p.color,
      isLeader: p.isLeader || idx === 0,
      isBot: p.isBot ?? false,
      position: this.getInitialPlayerSpawnPosition(idx),
      velocity: { x: 0, y: 0 },
      xp: 0,
      growthPhase: 1,
      collisionRadius: 7.5, 
      visualSize: 0.45,     
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
      difficulty,
      createdAt: Date.now(),
      startedAt: Date.now(),
      status: 'active',
      timerStartMs: Date.now(),
      gameTimerDurationMs: SESSION_DURATION_MS,
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

  private getInitialPlayerSpawnPosition(index: number): { x: number; y: number } {
    return { x: 250 + (index % 2) * 50, y: 250 + Math.floor(index / 2) * 50 }
  }

  private getGrowthPhase(xp: number): 1 | 2 | 3 {
    if (xp >= PLAYER_GROWTH_CONFIG[3].xpThreshold) {
      return 3;
    } else if (xp >= PLAYER_GROWTH_CONFIG[2].xpThreshold) {
      return 2;
    } else {
      return 1;
    }
  }

  private getCollisionRadius(phase: 1 | 2 | 3): number {
    return PLAYER_GROWTH_CONFIG[phase].collisionRadius;
  }

  private getVisualSize(phase: 1 | 2 | 3): number {
    return PLAYER_GROWTH_CONFIG[phase].visualSize;
  }

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

  completePlayerRespawn(playerId: string, newPosition: Vec2D): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    player.status = 'alive';
    player.position = newPosition;
    player.velocity = { x: 0, y: 0 };
    player.respawnTimeMs = null;
    return true;
  }

  isPlayerInGrace(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.graceEndTimeMs) return false;
    return Date.now() < player.graceEndTimeMs;
  }

  addPlayerPowerup(playerId: string, powerupType: 'speed-boost' | 'double-xp' | 'invincibility', durationMs: number = 10000): boolean {
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

  removePlayerPowerup(playerId: string, powerupType: 'speed-boost' | 'double-xp' | 'invincibility'): boolean {
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

  cleanupExpiredPlayerPowerups(): void {
    const now = Date.now();
    for (const player of this.state.players) {
      const toRemove: ('speed-boost' | 'double-xp' | 'invincibility')[] = [];
      
      for (const [powerupType, endTime] of player.powerupEndTimes) {
        if (now >= endTime) {
          toRemove.push(powerupType as 'speed-boost' | 'double-xp' | 'invincibility');
        }
      }
      
      for (const powerupType of toRemove) {
        this.removePlayerPowerup(player.id, powerupType);
      }
    }
  }

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

  updateLeaderboard(): GameLeaderboardEntry[] {
    this.state.leaderboard = this.computeLeaderboard(this.state.players);
    return this.state.leaderboard;
  }

  queueEvents(events: any[]): void {
    if (!events.length) return;
    this.pendingEvents.push(...events);
  }

  drainEvents(): any[] {
    const queued = this.pendingEvents;
    this.pendingEvents = [];
    return queued;
  }

  getState(): GameState {
    return this.state;
  }

  incrementTick(): void {
    this.state.serverTick++;
  }

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

  public setTimeRemainingMs(remainingMs: number): void {
    const now = Date.now();
    const elapsed = this.state.gameTimerDurationMs - remainingMs;
    this.state.timerStartMs = now - elapsed - this.state.pausedElapsedMs;
  }

  pauseGame(leaderId: string): boolean {
    if (this.state.isPaused) return false;
    console.log(`[PAUSE] Game paused by leader ${leaderId} at ${Date.now()}, pausedElapsedMs: ${this.state.pausedElapsedMs}`);
    this.state.isPaused = true;
    this.state.pausedByLeaderId = leaderId;
    this.state.pausedAt = Date.now();
    return true;
  }

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

  markPlayerQuit(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;
    player.status = 'quit';
    player.velocity.x = 0;
    player.velocity.y = 0;
    return true;
  }
}

export interface VirtualOpponentProfile {
  difficulty: 'easy' | 'medium' | 'hard';
  reactionIntervalMs: number;
  targetSwitchIntervalMs: number;
  targetUpgradeCooldownMs: number;
  directionChangeCooldownMs: number;
  playerTargetCooldownMs: number;
  riskTolerance: number;
  jitterStrength: number;
}

export interface VirtualOpponentState {
  playerId: string;
  profile: VirtualOpponentProfile;
  currentTargetId: string | null;
  currentTargetValue: number;
  nextTargetUpgradeAt: number;
  lastInputDirection: { x: -1 | 0 | 1; y: -1 | 0 | 1 } | null;
  lastInputChangeAt: number;
  lastDecisionAt: number;
  nextDecisionAt: number;
  lastDirectionChangeAt: number;
  seed: number;
  ignoredPlayerUntil: Record<string, number>;
}

export interface BotRoster {
  byPlayerId: Record<string, VirtualOpponentState>;
}