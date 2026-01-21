import type { LobbyState, Player, GameSession } from '../../shared/types';

export interface LobbyRecord extends LobbyState {
  players: Player[];
  activeSession?: GameSession;
  joinCounter: number;
  waiting: Player[];
}

export class LobbyStore {
  private lobbies = new Map<string, LobbyRecord>();

  get(lobbyId: string): LobbyRecord | null {
    return this.lobbies.get(lobbyId) ?? null;
  }

  set(lobbyId: string, lobby: LobbyRecord): void {
    this.lobbies.set(lobbyId, lobby);
  }

  delete(lobbyId: string): void {
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

// Export a singleton instance
export const lobbyStore = new LobbyStore();