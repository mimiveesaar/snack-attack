export type Gamemode = 'singleplayer' | 'multiplayer';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type LobbyStatus = 'waiting' | 'active';
export type OpponentColor = 'red' | 'blue' | 'green' | 'orange';

export interface OpponentSlot {
  slotId: number;
  name: string;
  color: OpponentColor;
  isActive: boolean;
}

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
  singleplayerSettings?: {
    opponents: OpponentSlot[];
  };
  maxPlayers: number;
  status: LobbyStatus;
  shareUrl: string;
  createdAt: string;
}
