import type { Namespace } from 'socket.io';
import type { GameClientToServerEvents, GameServerToClientEvents, GameStateUpdatePayload } from '../../shared/game-events';
import { getGameSession } from '../feature/session/session-store';
import { collisionDetector } from '../feature/collision';
import { NPCManager } from '../feature/npc/npc-manager';
import { PlayerManager } from '../feature/player/player-manager';
import { PowerupManager } from '../feature/powerup/powerup-manager';
import { FixedStepEngine } from './engine';
import { GameSessionState } from './state';

const TICK_RATE_HZ = 60;
const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ; // ~16.67ms

const BROADCAST_RATE_HZ = 20;
const BROADCAST_INTERVAL_TICKS = TICK_RATE_HZ / BROADCAST_RATE_HZ; // 6 ticks

const TIMER_TICK_INTERVAL_TICKS = TICK_RATE_HZ; // Every 60 ticks = 1 second

export class GameLoop {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
  private npcManager: NPCManager;
  private playerManager : PlayerManager;
  private powerupManager : PowerupManager;
  private sessionId: string;
  private engine: FixedStepEngine;
  private tickCount: number = 0;
  private running: boolean = false;

  constructor(
    sessionId: string,
    gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>
  ) {
    this.sessionId = sessionId;
    this.gameNamespace = gameNamespace;
    this.npcManager = new NPCManager(TICK_INTERVAL_MS);
    this.playerManager = new PlayerManager(TICK_INTERVAL_MS);
    this.powerupManager = new PowerupManager();
    this.engine = new FixedStepEngine(TICK_INTERVAL_MS);
  }

  start(): void {
    if (this.running) return;

    console.log(`GameLoop: Starting for session ${this.sessionId}`);
    this.running = true;
    this.tickCount = 0;

    this.engine.start(() => this.tick());
  }

  stop(): void {
    if (!this.running) return;

    console.log(`GameLoop: Stopping for session ${this.sessionId}`);
    this.running = false;

    this.engine.stop();
  }

  // Main game loop.
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
      this.broadcastTimerTick(session);
      this.stop();
      return;
    }

    // Update player state.
    this.playerManager.tick(session);

    // Update NPCs (spawning, positioning)
    this.npcManager.tick(session);

    // Update power-ups
    this.powerupManager.tick(session);

    // Process collisions (eating, boundary) and collect events
    const collisionEvents = collisionDetector.processCollisions(session);
    session.queueEvents(collisionEvents);

    // Broadcast state update every BROADCAST_INTERVAL_TICKS
    if (this.tickCount % BROADCAST_INTERVAL_TICKS === 0) {
      this.broadcastStateUpdate(session, session.drainEvents());
    }

    // Broadcast timer tick every TIMER_TICK_INTERVAL_TICKS
    // Clients can update a timer display smoothly at 60 Hz without processing heavy state data
    if (this.tickCount % TIMER_TICK_INTERVAL_TICKS === 0) {
      this.broadcastTimerTick(session);
    }

    this.tickCount++;
  }

  /**
   * Broadcast state update to all players
   */
  private broadcastStateUpdate(session: GameSessionState, events: any[] = []): void {
    const state = session.getState();
    const payload : GameStateUpdatePayload = {
      serverTick: state.serverTick,
      timestamp: Date.now(),
      players: state.players.map((p) => ({
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
      npcs: state.npcs.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        velocity: n.velocity,
        visualSize: n.visualSize,
      })),
      powerups: state.powerups.map((p) => ({
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
