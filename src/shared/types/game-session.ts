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
