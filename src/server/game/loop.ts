/**
 * Game Loop - Server-side 60 Hz fixed timestep game loop
 *
 * Responsibilities:
 * - Tick at 60 Hz (16.67ms per tick)
 * - Process collisions, physics, state updates
 * - Broadcast state updates every 10 Hz (every 6 ticks)
 * - Update timer every tick
 * - Handle game end condition
 */

import type { Namespace } from 'socket.io';
import type { GameClientToServerEvents, GameServerToClientEvents } from '../../shared/game-events';
import { GameSessionState, getGameSession } from './state';
import { collisionDetector } from '../feature/collision';
import { powerupSpawner } from '../feature/powerup/powerup-spawner';
import { NPCManager } from '../feature/npc/npc-manager';

const TICK_RATE_HZ = 60;
const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ; // ~16.67ms

const BROADCAST_RATE_HZ = 20;
const BROADCAST_INTERVAL_TICKS = TICK_RATE_HZ / BROADCAST_RATE_HZ; // 6 ticks

const TIMER_TICK_INTERVAL_TICKS = TICK_RATE_HZ; // Every 60 ticks = 1 second

export class GameLoop {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
  private npcManager: NPCManager;
  private sessionId: string;
  private intervalId: NodeJS.Timeout | null = null;
  private tickCount: number = 0;
  private running: boolean = false;

  constructor(
    sessionId: string,
    gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>
  ) {
    this.sessionId = sessionId;
    this.gameNamespace = gameNamespace;
    this.npcManager = new NPCManager(TICK_INTERVAL_MS);
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;

    console.log(`GameLoop: Starting for session ${this.sessionId}`);
    this.running = true;
    this.tickCount = 0;

    this.intervalId = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.running) return;

    console.log(`GameLoop: Stopping for session ${this.sessionId}`);
    this.running = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Main game loop tick
   */
  private tick(): void {
    const session = getGameSession(this.sessionId);
    if (!session) {
      this.stop();
      return;
    }

    const state = session.getState();
    session.incrementTick();

    // If game is paused, skip all updates except broadcasting current state
    if (state.isPaused) {
      // Still broadcast state so clients can see pause state
      if (this.tickCount % BROADCAST_INTERVAL_TICKS === 0) {
        this.broadcastStateUpdate(session, session.drainEvents());
      }
      this.tickCount++;
      return;
    }

    // Check if game has ended (time limit reached) AFTER pause check
    // Use a small threshold (100ms) to avoid race conditions with remaining time display
    const timeRemaining = session.getTimeRemainingMs();
    if (timeRemaining <= 100 && state.status !== 'ended') {
      console.log(`GameLoop: Game ending with ${timeRemaining}ms remaining`);
      state.status = 'ended';
      this.broadcastGameEnded(session);
      this.stop();
      return;
    }

    // Update player state (process inputs, physics, etc.)
    this.updatePlayers(session);

    // Update NPCs (spawning, positioning)
    this.npcManager.tick(session);

    // Update power-ups
    this.updatePowerUps(session);

    // Process collisions (eating, boundary) and collect events
    const collisionEvents = collisionDetector.processCollisions(session, Date.now());
    session.queueEvents(collisionEvents);

    // Broadcast state update every BROADCAST_INTERVAL_TICKS
    if (this.tickCount % BROADCAST_INTERVAL_TICKS === 0) {
      this.broadcastStateUpdate(session, session.drainEvents());
    }

    // Broadcast timer tick every TIMER_TICK_INTERVAL_TICKS
    if (this.tickCount % TIMER_TICK_INTERVAL_TICKS === 0) {
      this.broadcastTimerTick(session);
    }

    this.tickCount++;
  }

  /**
   * Update player states (movement, respawn, etc.)
   */
  private updatePlayers(session: any): void {
    const state = session.getState();
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 600;
    const now = Date.now();

    for (const player of state.players) {
      // Handle respawning players
      if (player.status === 'respawning' && player.respawnTimeMs && now >= player.respawnTimeMs) {
        // Find safe respawn position
        const spawnPos = this.findSafeRespawnLocation(session);
        if (spawnPos) {
          session.completePlayerRespawn(player.id, spawnPos);
        }
        continue;
      }

      if (player.status !== 'alive') continue;

      // Update position based on velocity
      player.position.x += player.velocity.x * TICK_INTERVAL_MS;
      player.position.y += player.velocity.y * TICK_INTERVAL_MS;

      // Boundary collision (keep player in bounds)
      const radius = player.collisionRadius;
      if (player.position.x - radius < 0) player.position.x = radius;
      if (player.position.x + radius > GAME_WIDTH) player.position.x = GAME_WIDTH - radius;
      if (player.position.y - radius < 0) player.position.y = radius;
      if (player.position.y + radius > GAME_HEIGHT) player.position.y = GAME_HEIGHT - radius;
    }
  }

  /**
   * Find a safe respawn location for a player
   */
  private findSafeRespawnLocation(session: any): { x: number; y: number } | null {
    const state = session.getState();
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 600;
    const BOUNDARY_BUFFER = 50;
    const SAFE_DISTANCE = 100; // pixels from any other fish
    const attempts = 20;

    for (let i = 0; i < attempts; i++) {
      const x = BOUNDARY_BUFFER + Math.random() * (GAME_WIDTH - 2 * BOUNDARY_BUFFER);
      const y = BOUNDARY_BUFFER + Math.random() * (GAME_HEIGHT - 2 * BOUNDARY_BUFFER);

      let safe = true;

      // Check distance to all other alive players
      for (const player of state.players) {
        if (player.status !== 'alive') continue;
        const dx = x - player.position.x;
        const dy = y - player.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SAFE_DISTANCE) {
          safe = false;
          break;
        }
      }

      // Check distance to all NPCs
      if (safe) {
        for (const npc of state.npcs) {
          const dx = x - npc.position.x;
          const dy = y - npc.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < SAFE_DISTANCE) {
            safe = false;
            break;
          }
        }
      }

      if (safe) {
        return { x, y };
      }
    }

    // If no safe location found, return a random position anyway
    return {
      x: BOUNDARY_BUFFER + Math.random() * (GAME_WIDTH - 2 * BOUNDARY_BUFFER),
      y: BOUNDARY_BUFFER + Math.random() * (GAME_HEIGHT - 2 * BOUNDARY_BUFFER),
    };
  }

  /**
   * Update power-up states
   */
  private updatePowerUps(session: any): void {
    // Spawn new powerups via spawner tick
    powerupSpawner.tick(session);

    // Clean up expired powerups from players
    session.cleanupExpiredPowerups();

    // Clean up expired powerup items
    powerupSpawner.cleanupExpiredPowerups(session);
  }


  /**
   * Broadcast state update to all players
   */
  private broadcastStateUpdate(session: any, events: any[] = []): void {
    const state = session.getState();
    const payload = {
      serverTick: state.serverTick,
      timestamp: Date.now(),
      players: state.players.map((p: any) => ({
        playerId: p.id,
        position: p.position,
        velocity: p.velocity,
        xp: p.xp,
        growthPhase: p.growthPhase,
        visualSize: p.visualSize,
        status: p.status,
        powerups: p.powerups,
        powerupEndTimeMs: p.powerups.length > 0 ? (p.powerupEndTimes?.get(p.powerups[0]) ?? null) : null,
        color: p.color,
        nicknameDisplay: p.nicknameDisplay,
      })),
      npcs: state.npcs.map((n: any) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        velocity: n.velocity,
        visualSize: n.visualSize,
      })),
      powerups: state.powerups.map((p: any) => ({
        id: p.id,
        type: p.type,
        position: p.position,
        status: p.status,
        collisionRadius: p.collisionRadius,
      })),
      status: state.status,
      isPaused: state.isPaused,
      pausedByLeaderNickname: state.pausedByLeaderId
        ? state.players.find((p: any) => p.id === state.pausedByLeaderId)?.nicknameDisplay || null
        : null,
      timerRemainingMs: session.getTimeRemainingMs(),
      events: events,
      leaderboard: session.updateLeaderboard().map((entry: any, idx: number) => ({
        playerId: entry.id,
        nicknameDisplay: entry.nicknameDisplay,
        rank: idx + 1,
        xp: entry.xp,
        status: entry.status,
        isLeader: entry.isLeader,
      })),
    };

    this.gameNamespace.to(this.sessionId).emit('game:state-update', payload);
  }

  /**
   * Broadcast timer tick
   */
  private broadcastTimerTick(session: any): void {
    const state = session.getState();
    this.gameNamespace.to(this.sessionId).emit('game:timer-tick', {
      serverTick: state.serverTick,
      timerRemainingMs: session.getTimeRemainingMs(),
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast game ended
   */
  private broadcastGameEnded(session: any): void {
    const state = session.getState();
    const leaderboard = session.updateLeaderboard();
    const winner = leaderboard.length > 0 ? leaderboard[0] : null;

    // Check for draw - multiple players with same highest XP
    let isDraw = false;
    if (leaderboard.length > 1 && winner) {
      const topXP = winner.xp;
      const playersWithTopXP = leaderboard.filter((entry: any) => entry.xp === topXP);
      isDraw = playersWithTopXP.length > 1;
    }

    const payload = {
      sessionId: state.sessionId,
      lobbyId: state.lobbyId,
      isDraw,
      winner: winner
        ? {
            playerId: winner.id,
            nicknameDisplay: winner.nicknameDisplay,
            xp: winner.xp,
          }
        : null,
      leaderboard: leaderboard.map((entry: any, idx: number) => ({
        playerId: entry.id,
        nicknameDisplay: entry.nicknameDisplay,
        rank: idx + 1,
        xp: entry.xp,
        status: entry.status,
      })),
      totalDurationMs: Date.now() - state.startedAt,
      timestamp: Date.now(),
    };

    this.gameNamespace.to(this.sessionId).emit('game:ended', payload);
  }
}

/**
 * Global game loop store
 */
const loopStore = new Map<string, GameLoop>();

export function createGameLoop(
  sessionId: string,
  gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>
): GameLoop {
  const loop = new GameLoop(sessionId, gameNamespace);
  loopStore.set(sessionId, loop);
  return loop;
}

export function getGameLoop(sessionId: string): GameLoop | undefined {
  return loopStore.get(sessionId);
}

export function deleteGameLoop(sessionId: string): void {
  const loop = loopStore.get(sessionId);
  if (loop) {
    loop.stop();
  }
  loopStore.delete(sessionId);
}
