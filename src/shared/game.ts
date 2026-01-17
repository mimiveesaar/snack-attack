import type { Player, Gamemode, Difficulty } from './lobby';
import type { GameSession, LeaderboardEntry } from './game-session';

/**
 * Game State: Represents the runtime state of an active game session.
 * This is what players see and interact with during gameplay.
 */
export interface GameState {
  sessionId: string;
  lobbyId: string;
  players: Player[];
  gamemode: Gamemode;
  difficulty: Difficulty;
  status: 'active' | 'ended';
  timerRemainingMs: number;
  leaderboard: LeaderboardEntry[];
  seatsAvailable?: number;
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
}

/**
 * Game Input: Events sent by players during gameplay
 * (movement, actions, etc.)
 */
export interface GameInput {
  playerId: string;
  direction?: 'up' | 'down' | 'left' | 'right' | null;
  action?: 'fire' | 'special' | null;
  timestamp: number;
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
 * (collision, point awarded, player eliminated, etc.)
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
