import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types';
import { lobbyStore, type LobbyRecord } from './lobby-store';
import { gameSessionManager } from './game-session';

const PORT = Number(process.env.SOCKET_PORT || 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const SHARE_BASE = process.env.SHARE_BASE || CLIENT_ORIGIN;

const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;

function toLobbyState(lobby: LobbyRecord) {
  const { waiting: _waiting, joinCounter: _joinCounter, activeSession: _activeSession, ...state } = lobby;
  return state;
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

lobbyStore.startCleanup();

const lobbyNs = io.of('/lobby');

lobbyNs.on('connection', (socket) => {
  socket.data.playerId = socket.id;

  socket.on('lobby:create', (payload, callback) => {
    if (!NICKNAME_REGEX.test(payload.nickname)) {
      socket.emit('lobby:error', { message: 'Invalid nickname' });
      callback(null as unknown as any);
      return;
    }

    const lobby = lobbyStore.createLobby({
      playerId: socket.id,
      nickname: payload.nickname,
      color: payload.color,
      baseUrl: SHARE_BASE,
    });

    socket.data.lobbyId = lobby.lobbyId;
    socket.join(lobby.lobbyId);
    callback(toLobbyState(lobby));
    lobbyNs.to(lobby.lobbyId).emit('lobby:state', toLobbyState(lobby));
  });

  socket.on('lobby:join', (payload, callback) => {
    if (!NICKNAME_REGEX.test(payload.nickname)) {
      socket.emit('lobby:error', { message: 'Invalid nickname' });
      callback(null as unknown as any);
      return;
    }

    const result = lobbyStore.joinLobby({
      lobbyId: payload.lobbyId,
      playerId: socket.id,
      nickname: payload.nickname,
      color: payload.color,
    });

    if (!result.state) {
      socket.emit('lobby:error', { message: 'Lobby not found' });
      callback(null as unknown as any);
      return;
    }

    if (result.error) {
      socket.emit('lobby:error', { message: result.error });
      callback(null as unknown as any);
      return;
    }

    socket.data.lobbyId = payload.lobbyId;
    socket.join(payload.lobbyId);

    if (result.waiting && result.state.activeSession) {
      const { activeSession } = result.state;
      socket.emit('game:waiting', {
        lobbyId: result.state.lobbyId,
        leaderboard: activeSession?.leaderboard ?? [],
        timerRemainingMs: activeSession?.timerRemainingMs ?? 0,
      });
    } else {
      callback(toLobbyState(result.state));
      lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(result.state));
    }
  });

  socket.on('lobby:updateSettings', (payload, callback) => {
    const result = lobbyStore.updateSettings({
      lobbyId: payload.lobbyId,
      leaderId: socket.id,
      gamemode: payload.gamemode,
      difficulty: payload.difficulty,
    });

    if (!result.state) {
      if (result.error) socket.emit('lobby:error', { message: result.error });
      callback(null as unknown as any);
      return;
    }

    for (const kicked of result.kicked ?? []) {
      lobbyNs.to(kicked.id).emit('lobby:kicked', { reason: 'capacity' });
      lobbyNs.sockets.get(kicked.id)?.leave(payload.lobbyId);
    }

    const state = toLobbyState(result.state);
    callback(state);
    lobbyNs.to(payload.lobbyId).emit('lobby:state', state);
  });

  socket.on('lobby:start', (payload, callback) => {
    const result = lobbyStore.startGame(payload.lobbyId, socket.id);
    if (!result.session) {
      if (result.error) socket.emit('lobby:error', { message: result.error });
      callback(null as unknown as any);
      return;
    }

    const lobby = lobbyStore.getState(payload.lobbyId);
    if (lobby) {
      lobbyNs.to(payload.lobbyId).emit('game:started', result.session);
      lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(lobby));
      gameSessionManager.start(payload.lobbyId, lobbyNs);
    }

    callback(result.session);
  });

  socket.on('lobby:leave', (payload) => {
    socket.leave(payload.lobbyId);
    const { state, deleted } = lobbyStore.leaveLobby(payload.lobbyId, socket.id);
    if (state && !deleted) {
      lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(state));
    }
  });

  socket.on('disconnect', () => {
    const lobbyId = socket.data.lobbyId as string | undefined;
    if (!lobbyId) return;
    const { state, deleted } = lobbyStore.leaveLobby(lobbyId, socket.id);
    if (state && !deleted) {
      lobbyNs.to(lobbyId).emit('lobby:state', toLobbyState(state));
    } else if (deleted) {
      gameSessionManager.stop(lobbyId);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on :${PORT}`);
});
