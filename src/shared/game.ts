import type { Player, Gamemode, Difficulty } from './lobby';
import type { GameSession, LeaderboardEntry } from './game-session';

export interface Vec2D {
  x: number;
  y: number;
}

/**
 * Game-specific player state during active gameplay
 */
export interface GamePlayer {
  id: string;
  nicknameDisplay: string;
  color: string;
  isLeader: boolean;
  position: Vec2D;
  velocity: Vec2D;
  xp: number;
  growthPhase: 1 | 2 | 3;
  collisionRadius: number;
  visualSize: number;
  status: 'alive' | 'respawning' | 'spectating' | 'quit';
  respawnTimeMs: number | null;
  graceEndTimeMs: number | null;
  powerups: ('speed-boost' | 'double-xp' | 'invincibility')[];
  powerupEndTimes: Map<'speed-boost' | 'double-xp' | 'invincibility', number>;
  lastInputTick: number;
  inputQueue: GameInput[];
}

export interface GameNPC {
  id: string;
  type: 'pink' | 'grey' | 'brown';
  xp: number;
  position: Vec2D;
  velocity: Vec2D;
  collisionRadius: number;
  visualSize: number;
  status: 'spawning' | 'alive' | 'despawning';
  spawnTimeMs: number;
}

export interface GamePowerUp {
  id: string;
  type: 'invincibility' | 'speed-boost' | 'double-xp';
  position: Vec2D;
  collisionRadius: number;
  spawnTimeMs: number;
  status: 'spawning' | 'available' | 'collected' | 'despawning';
}

export interface GameLeaderboardEntry {
  id: string;
  nicknameDisplay: string;
  xp: number;
  isLeader: boolean;
  status: 'alive' | 'respawning' | 'spectating' | 'quit';
}

/**
 * Game State: Complete runtime state of an active game session.
 * This is the server authoritative state.
 */
export interface GameState {
  sessionId: string;
  lobbyId: string;
  createdAt: number;
  startedAt: number;
  status: 'active' | 'paused' | 'ended';
  timerStartMs: number;
  gameTimerDurationMs: number;
  isPaused: boolean;
  pausedByLeaderId: string | null;
  pausedAt: number | null;
  pausedElapsedMs: number;
  serverTick: number;
  players: GamePlayer[];
  npcs: GameNPC[];
  powerups: GamePowerUp[];
  leaderboard: GameLeaderboardEntry[];
}

/**
 * Player Game State: Individual player state during a game.
 * Tracks score, position, and input readiness.
 */
export interface PlayerGameState {
  playerId: string;
  nicknameDisplay: string;
  color: string;
  score: number;
  isAlive: boolean;
  positionX: number;
  positionY: number;
  ready: boolean;
  activePowerup?: 'invincibility' | 'speed-boost' | 'double-xp';
  powerupEndTimeMs?: number;
}

/**
 * Game Input: Movement input sent by players during gameplay
 */
export interface GameInput {
  playerId: string;
  direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 };
  timestamp: number;
  tick: number;
}

/**
 * Game Update: Server broadcast of current game state
 * to all connected players.
 */
export interface GameUpdate {
  sessionId: string;
  timestamp: number;
  players: PlayerGameState[];
  leaderboard: LeaderboardEntry[];
  timerRemainingMs: number;
  events?: GameEvent[];
}

/**
 * Game Event: In-game events that occur
 * (collision, point awarded, elimination, etc.)
 */
export interface GameEvent {
  type: 'collision' | 'point' | 'elimination' | 'powerup' | 'custom';
  playerId?: string;
  targetId?: string;
  points?: number;
  data?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Game Result: Final result when a game session ends.
 */
export interface GameResult {
  sessionId: string;
  lobbyId: string;
  leaderboard: LeaderboardEntry[];
  winner: LeaderboardEntry | null;
  totalDurationMs: number;
}
