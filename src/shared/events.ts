import type { LobbyState } from './lobby';
import type { ActiveGameSnapshot, GameSession } from './game-session';

export interface WaitingPayload {
  lobbyId: string;
  waitingPosition: number;
  isLobbyFull: boolean;
  fullMessage: string | null;
  snapshot: ActiveGameSnapshot;
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
  'lobby:updateSettings': (
    payload: {
      lobbyId: string;
      gamemode: LobbyState['gamemode'];
      difficulty: LobbyState['difficulty'];
      singleplayerSettings?: LobbyState['singleplayerSettings'];
    },
    callback: (state: LobbyState | null) => void
  ) => void;
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
