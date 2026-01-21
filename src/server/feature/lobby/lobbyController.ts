import type { Namespace } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import type { ActiveGameSnapshot } from '../../../shared/game-session';
import { lobbyManager } from './lobbyManager';
import { lobbyStore, type LobbyRecord } from './lobbyStore';
import { BASE_URL  } from '../../../shared/config';

export class LobbyController {
  private waitingInterval: NodeJS.Timeout | null = null;

  registerHandlers(params: {
    lobbyNamespace: Namespace<ClientToServerEvents, ServerToClientEvents>;
    gameSession: {
      getActiveGameSnapshot: (lobbyId: string) => ActiveGameSnapshot;
      start: (lobbyId: string, io: Namespace<ClientToServerEvents, ServerToClientEvents>) => void;
      stop: (lobbyId: string) => void;
    };
  }): void {
    const { lobbyNamespace: lobbyNamespace, gameSession} = params;

    lobbyNamespace.on('connection', (socket) => {
      socket.data.playerId = socket.id;

      socket.on('lobby:create', (payload, callback) => {

        const { lobby, error } = lobbyManager.createLobby({
          playerId: socket.id,
          nickname: payload.nickname,
          color: payload.color,
          baseUrl: BASE_URL,
        });

        console.log('Server: Created lobby:', lobby, 'error:', error);

        if (error || !lobby) {
          socket.emit('lobby:error', { message: error ? error : 'Failed to create lobby' });
          callback(null as unknown as any);
          return;
        }

        lobbyStore.set(lobby.lobbyId, lobby);

        socket.data.lobbyId = lobby.lobbyId;
        socket.join(lobby.lobbyId);
        callback(this.toLobbyState(lobby));
        lobbyNamespace.to(lobby.lobbyId).emit('lobby:state', this.toLobbyState(lobby));
      });

      socket.on('lobby:join', (payload, callback) => {

        const lobby = lobbyStore.get(payload.lobbyId);
        if (!lobby) {
          socket.emit('lobby:error', { message: 'Lobby not found' });
          callback(null as unknown as any);
          return;
        }

        const result = lobbyManager.joinLobby(lobby, {
          playerId: socket.id,
          nickname: payload.nickname,
          color: payload.color,
        });

        if (result.error) {
          socket.emit('lobby:error', { message: result.error });
          callback(null as unknown as any);
          return;
        }

        socket.data.lobbyId = payload.lobbyId;
        socket.join(payload.lobbyId);

        if (result.waiting && lobby.activeSession) {
          socket.emit('game:waiting', this.buildWaitingPayload(lobby, socket.id, gameSession));
        } else {
          callback(this.toLobbyState(lobby));
          lobbyNamespace.to(payload.lobbyId).emit('lobby:state', this.toLobbyState(lobby));
        }
      });

      socket.on('lobby:updateSettings', (payload, callback) => {
        const lobby = lobbyStore.get(payload.lobbyId);
        if (!lobby) {
          socket.emit('lobby:error', { message: 'Lobby not found' });
          callback(null as unknown as any);
          return;
        }

        const result = lobbyManager.updateSettings(lobby, {
          leaderId: socket.id,
          gamemode: payload.gamemode,
          difficulty: payload.difficulty,
        });

        if (result.error) {
          socket.emit('lobby:error', { message: result.error });
          callback(null as unknown as any);
          return;
        }

        for (const kicked of result.kicked ?? []) {
          lobbyNamespace.to(kicked.id).emit('lobby:kicked', { reason: 'capacity' });
          lobbyNamespace.sockets.get(kicked.id)?.leave(payload.lobbyId);
        }

        const state = this.toLobbyState(lobby);
        callback(state);
        lobbyNamespace.to(payload.lobbyId).emit('lobby:state', state);
      });

      socket.on('lobby:start', (payload, callback) => {
        const lobby = lobbyStore.get(payload.lobbyId);
        if (!lobby) {
          socket.emit('lobby:error', { message: 'Lobby not found' });
          callback(null as unknown as any);
          return;
        }

        const result = lobbyManager.createGame(lobby, socket.id);
        if (!result.session) {
          if (result.error) socket.emit('lobby:error', { message: result.error });
          callback(null as unknown as any);
          return;
        }

        console.log(`Server: Game starting for lobby ${payload.lobbyId}, session ${result.session.sessionId}`);

        console.log(`Server: Emitting game:started to lobby ${payload.lobbyId} with session:`, result.session);
        lobbyNamespace.to(payload.lobbyId).emit('game:started', result.session);
        lobbyNamespace.to(payload.lobbyId).emit('lobby:state', this.toLobbyState(lobby));
        console.log(`Server: Calling gameSessionManager.start for lobby ${payload.lobbyId}`);
        gameSession.start(payload.lobbyId, lobbyNamespace);

        callback(result.session);
      });

      socket.on('lobby:leave', (payload) => {
        socket.leave(payload.lobbyId);
        const lobby = lobbyStore.get(payload.lobbyId);
        if (!lobby) return;
        lobbyManager.leaveLobby(lobby, socket.id);
        if (lobby.players.length === 0) {
          lobbyStore.delete(payload.lobbyId);
          return;
        }
        lobbyNamespace.to(payload.lobbyId).emit('lobby:state', this.toLobbyState(lobby));
      });

      socket.on('disconnect', () => {
        const lobbyId = socket.data.lobbyId as string | undefined;
        if (!lobbyId) return;
        const lobby = lobbyStore.get(lobbyId);
        if (!lobby) return;
        lobbyManager.leaveLobby(lobby, socket.id);
        if (lobby.players.length === 0) {
          lobbyStore.delete(lobbyId);
          gameSession.stop(lobbyId);
          return;
        }
        lobbyNamespace.to(lobbyId).emit('lobby:state', this.toLobbyState(lobby));
      });
    });

    this.startWaitingBroadcast(lobbyNamespace, gameSession);
  }

  private toLobbyState(lobby: LobbyRecord) {
    const { waiting: _waiting, joinCounter: _joinCounter, activeSession: _activeSession, ...state } = lobby;
    return state;
  }

  private buildWaitingPayload(
    lobby: LobbyRecord,
    playerId: string,
    gameSession: { getActiveGameSnapshot: (lobbyId: string) => ActiveGameSnapshot }
  ) {
    const waitingPosition = lobbyManager.getWaitingPosition(lobby, playerId) ?? 1;
    const isLobbyFull = lobby.players.length >= lobby.maxPlayers;
    const snapshot = gameSession.getActiveGameSnapshot(lobby.lobbyId);
    return {
      lobbyId: lobby.lobbyId,
      waitingPosition,
      isLobbyFull,
      fullMessage: isLobbyFull ? 'Lobby full. Waiting for a slot.' : null,
      snapshot,
    };
  }

  private startWaitingBroadcast(
    lobbyNs: Namespace<ClientToServerEvents, ServerToClientEvents>,
    gameSession: { getActiveGameSnapshot: (lobbyId: string) => ActiveGameSnapshot }
  ): void {
    if (this.waitingInterval) return;
    this.waitingInterval = setInterval(() => {
      for (const lobby of lobbyStore.list()) {
        if (lobby.waiting.length === 0) continue;
        for (const waitingPlayer of lobby.waiting) {
          lobbyNs.to(waitingPlayer.id).emit('game:waiting', this.buildWaitingPayload(lobby, waitingPlayer.id, gameSession));
        }
      }
    }, 1000);
  }
}

export const lobbyController = new LobbyController();
export type { LobbyRecord } from './lobbyStore';