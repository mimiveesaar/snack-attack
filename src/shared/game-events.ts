/**
 * Socket.IO event types and payloads for the /game namespace
 * Extends the shared types with game-specific events
 */

import type { Vec2D, GameLeaderboardEntry } from './game';

/**
 * Client → Server Events
 */

export interface GamePlayerReadyPayload {
  playerId: string;
  timestamp: number;
}

export interface GamePlayerInputPayload {
  playerId: string;
  direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 };
  timestamp: number;
  tick: number;
}

export interface GamePauseTogglePayload {
  playerId: string;
  isPaused: boolean;
  timestamp: number;
}

export interface GamePlayerQuitPayload {
  playerId: string;
  timestamp: number;
}

export interface GameClockSyncRequestPayload {
  clientTimestamp: number;
}

/**
 * Server → Client Events
 */

export interface GamePlayerStateUpdate {
  playerId: string;
  position: Vec2D;
  velocity: Vec2D;
  xp: number;
  growthPhase: 1 | 2 | 3;
  visualSize: number;
  status: 'alive' | 'respawning' | 'spectating';
  powerups: ('speed-boost' | 'double-xp')[];
  color: string;
  nicknameDisplay: string;
}

export interface GameNPCStateUpdate {
  id: string;
  type: 'pink' | 'grey' | 'brown';
  position: Vec2D;
  velocity: Vec2D;
  visualSize: number;
}

export interface GamePowerUpStateUpdate {
  id: string;
  type: 'speed-boost' | 'double-xp';
  position: Vec2D;
}

export interface GameLeaderboardEntryPayload {
  playerId: string;
  nicknameDisplay: string;
  rank: number;
  xp: number;
  status: 'active' | 'respawning' | 'spectating' | 'quit';
  isLeader: boolean;
}

export interface CollisionEventData {
  type: 'fish-eaten' | 'powerup-collected' | 'respawn-complete';
  tick: number;
  data: {
    eatenFishId?: string;
    eatenByPlayerId?: string;
    xpTransferred?: number;
    eatenByNewXp?: number;
    powerId?: string;
    collectedByPlayerId?: string;
    powerupType?: 'speed-boost' | 'double-xp';
    respawnedPlayerId?: string;
    respawnPosition?: Vec2D;
  };
}

export interface GameStateUpdatePayload {
  serverTick: number;
  timestamp: number;
  players: GamePlayerStateUpdate[];
  npcs: GameNPCStateUpdate[];
  powerups: GamePowerUpStateUpdate[];
  status: 'active' | 'paused' | 'ended';
  isPaused: boolean;
  pausedByLeaderNickname: string | null;
  timerRemainingMs: number;
  events: CollisionEventData[];
  leaderboard: GameLeaderboardEntryPayload[];
}

export interface GameCollisionPayload {
  type: 'fish-eaten' | 'powerup-collected' | 'respawn-complete';
  tick: number;
  data: {
    eatenFishId?: string;
    eatenByPlayerId?: string;
    xpTransferred?: number;
    eatenByNewXp?: number;
    powerId?: string;
    collectedByPlayerId?: string;
    powerupType?: 'speed-boost' | 'double-xp';
    respawnedPlayerId?: string;
    respawnPosition?: Vec2D;
  };
}

export interface GamePlayerDisconnectedPayload {
  playerId: string;
  nicknameDisplay: string;
  reason: 'quit' | 'timeout' | 'error';
  timestamp: number;
}

export interface GameTimerTickPayload {
  serverTick: number;
  timerRemainingMs: number;
  timestamp: number;
}

export interface GamePausedPayload {
  pausedByLeaderId: string;
  pausedByLeaderNickname: string;
  timestamp: number;
}

export interface GameResumedPayload {
  resumedByLeaderId: string;
  resumedByLeaderNickname: string;
  timestamp: number;
}

export interface GameResultsLeaderboardEntry {
  playerId: string;
  nicknameDisplay: string;
  rank: number;
  xp: number;
  status: 'active' | 'quit';
}

export interface GameEndedPayload {
  sessionId: string;
  lobbyId: string;
  winner: {
    playerId: string;
    nicknameDisplay: string;
    xp: number;
  } | null;
  leaderboard: GameResultsLeaderboardEntry[];
  totalDurationMs: number;
  timestamp: number;
}

export interface GameErrorPayload {
  code: string;
  message: string;
  timestamp: number;
}

export interface GameClockSyncResponsePayload {
  clientTimestamp: number;
  serverTimestamp: number;
}

/**
 * Socket.IO event typings for /game namespace
 */

export interface GameClientToServerEvents {
  'game:player-ready': (payload: GamePlayerReadyPayload) => void;
  'game:player-input': (payload: GamePlayerInputPayload) => void;
  'game:pause-toggle': (payload: GamePauseTogglePayload) => void;
  'game:player-quit': (payload: GamePlayerQuitPayload) => void;
  'game:sync-request': (payload: GameClockSyncRequestPayload) => void;
}

export interface GameServerToClientEvents {
  'game:state-update': (payload: GameStateUpdatePayload) => void;
  'game:collision': (payload: GameCollisionPayload) => void;
  'game:player-disconnected': (payload: GamePlayerDisconnectedPayload) => void;
  'game:timer-tick': (payload: GameTimerTickPayload) => void;
  'game:paused': (payload: GamePausedPayload) => void;
  'game:resumed': (payload: GameResumedPayload) => void;
  'game:ended': (payload: GameEndedPayload) => void;
  'game:error': (payload: GameErrorPayload) => void;
  'game:sync-response': (payload: GameClockSyncResponsePayload) => void;
}
