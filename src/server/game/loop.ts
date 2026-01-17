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
import type { GameClientToServerEvents, GameServerToClientEvents } from '@shared/game-events';
import { getGameSession } from './state';
import { collisionDetector } from './collision';
import { npcSpawner } from './npc-spawner';

const TICK_RATE_HZ = 60;
const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ; // ~16.67ms

const BROADCAST_RATE_HZ = 10;
const BROADCAST_INTERVAL_TICKS = TICK_RATE_HZ / BROADCAST_RATE_HZ; // 6 ticks

const TIMER_TICK_INTERVAL_TICKS = TICK_RATE_HZ; // Every 60 ticks = 1 second

export class GameLoop {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
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

    // Update timer
    session.updateTimer();

    // Check if game has ended (time limit reached)
    const timeRemaining = session.getTimeRemainingMs();
    if (timeRemaining <= 0 && state.status !== 'ended') {
      state.status = 'ended';
      this.broadcastGameEnded(session);
      this.stop();
      return;
    }

    // Update player state (process inputs, physics, etc.)
    this.updatePlayers(session);

    // Update NPCs (spawning, positioning)
    this.updateNPCs(session);

    // Update power-ups
    this.updatePowerUps(session);

    // Process collisions (eating, boundary)
    this.processCollisions(session);

    // Broadcast state update every BROADCAST_INTERVAL_TICKS
    if (this.tickCount % BROADCAST_INTERVAL_TICKS === 0) {
      this.broadcastStateUpdate(session);
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
    // TODO: Process pending player inputs, update positions, handle respawns
  }

  /**
   * Update NPC states (spawning, position updates)
   */
  private updateNPCs(session: any): void {
    const state = session.getState();
    
    // Spawn new NPCs via spawner tick
    npcSpawner.tick(session);

    // Update NPC positions (simple wandering behavior)
    for (const npc of state.npcs) {
      // Move in current direction
      npc.position.x += npc.velocity.x * TICK_INTERVAL_MS;
      npc.position.y += npc.velocity.y * TICK_INTERVAL_MS;

      // Occasionally change direction (10% chance per tick)
      if (Math.random() < 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50; // pixels per second
        npc.velocity.x = Math.cos(angle) * (speed / 1000) * TICK_INTERVAL_MS;
        npc.velocity.y = Math.sin(angle) * (speed / 1000) * TICK_INTERVAL_MS;
      }
    }

    // Clean up old despawned NPCs
    state.npcs = state.npcs.filter((npc: any) => npc.status !== 'destroyed');
  }

  /**
   * Update power-up states
   */
  private updatePowerUps(session: any): void {
    // TODO: Handle power-up expiration, spawning
  }

  /**
   * Process collisions (eating, boundary)
   */
  private processCollisions(session: any): void {
    const now = Date.now();

    // Process eating collisions
    const eatingEvents = collisionDetector.processEatingCollisions(session, now);

    // Process boundary collisions
    collisionDetector.processBoundaryCollisions(session);

    // Log collision events
    for (const event of eatingEvents) {
      console.log(`GameLoop: Collision event - ${event.type}`, event.data);
    }
  }

  /**
   * Broadcast state update to all players
   */
  private broadcastStateUpdate(session: any): void {
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
      })),
      status: state.status,
      isPaused: state.isPaused,
      pausedByLeaderNickname: state.pausedByLeaderId
        ? state.players.find((p: any) => p.id === state.pausedByLeaderId)?.nicknameDisplay || null
        : null,
      timerRemainingMs: session.getTimeRemainingMs(),
      events: [],
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

    const payload = {
      sessionId: state.sessionId,
      lobbyId: state.lobbyId,
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
