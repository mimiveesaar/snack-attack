export interface LeaderboardEntry {
  playerId: string;
  nicknameDisplay: string;
  score: number;
}

export interface WaitingLeaderboardEntry {
  playerId: string;
  nicknameDisplay: string;
  score: number;
  rank: number;
}

export interface ActiveGameSnapshot {
  hasActiveGame: boolean;
  timerRemainingMs: number | null;
  leaderboard: WaitingLeaderboardEntry[];
}

export interface GameSession {
  sessionId: string;
  lobbyId: string;
  status: 'active' | 'ended';
  timerRemainingMs: number;
  leaderboard: LeaderboardEntry[];
  seatsAvailable?: number;
}
