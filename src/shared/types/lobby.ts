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
