import { Player, LobbyState, GameSession } from '../../../shared/types';


export interface LobbyRecord extends LobbyState {
  players: Player[];
  activeSession?: GameSession;
  joinCounter: number;
  waiting: Player[];
}

export class LobbyStore {
  private lobbies = new Map<string, LobbyRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  startCleanup(intervalMs = 5 * 60 * 1000): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => this.cleanupEmptyLobbies(), intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  getState(lobbyId: string): LobbyRecord | null {
    return this.lobbies.get(lobbyId) ?? null;
  }

  setLobby(lobbyId: string, lobby: LobbyRecord): void {
    this.lobbies.set(lobbyId, lobby);
  }

  removeLobby(lobbyId: string): void {
    this.lobbies.delete(lobbyId);
  }

  list(): LobbyRecord[] {
    return Array.from(this.lobbies.values());
  }

  cleanupEmptyLobbies(): void {
    for (const [id, lobby] of this.lobbies) {
      if (lobby.players.length === 0) {
        this.lobbies.delete(id);
      }
    }
  }
}

export const lobbyStore = new LobbyStore();
