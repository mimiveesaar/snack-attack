export type Gamemode = 'singleplayer' | 'multiplayer';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type LobbyStatus = 'waiting' | 'active';

export interface Player {
  id: string;
  nicknameBase: string;
  nicknameDisplay: string;
  color: string;
  isLeader: boolean;
  joinOrder: number;
  connected: boolean;
}

export interface LobbyState {
  lobbyId: string;
  players: Player[];
  gamemode: Gamemode;
  difficulty: Difficulty;
  maxPlayers: number;
  status: LobbyStatus;
  shareUrl: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  playerId: string;
  nicknameDisplay: string;
  score: number;
}

export interface GameSession {
  sessionId: string;
  lobbyId: string;
  status: 'active' | 'ended';
  timerRemainingMs: number;
  leaderboard: LeaderboardEntry[];
  seatsAvailable?: number;
}

export interface WaitingPayload {
  lobbyId: string;
  leaderboard: LeaderboardEntry[];
  timerRemainingMs: number;
}

export interface KickedPayload {
  reason: 'capacity' | 'leader-change';
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export interface ClientToServerEvents {
  'lobby:create': (payload: { nickname: string; color: string }, callback: (state: LobbyState) => void) => void;
  'lobby:join': (payload: { lobbyId: string; nickname: string; color: string }, callback: (state: LobbyState | null) => void) => void;
  'lobby:updateSettings': (payload: { lobbyId: string; gamemode: Gamemode; difficulty: Difficulty }, callback: (state: LobbyState | null) => void) => void;
  'lobby:start': (payload: { lobbyId: string }, callback: (session: GameSession | null) => void) => void;
  'lobby:leave': (payload: { lobbyId: string }) => void;
}

export interface ServerToClientEvents {
  'lobby:state': (state: LobbyState) => void;
  'lobby:kicked': (payload: KickedPayload) => void;
  'lobby:error': (payload: ErrorPayload) => void;
  'game:waiting': (payload: WaitingPayload) => void;
  'game:started': (session: GameSession) => void;
  'game:ended': (payload: GameSession) => void;
}
