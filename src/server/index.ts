import { createServer } from 'node:http';
import { Server, Namespace } from 'socket.io';

import { lobbyStore, type LobbyRecord } from './lobby-store';
import { gameSessionManager } from './game-session';
import { ClientToServerEvents, ServerToClientEvents, GameClientToServerEvents, GameServerToClientEvents } from '../shared/types';
import { GameController } from './game/controller';

const PORT = Number(process.env.SOCKET_PORT || 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const SHARE_BASE = process.env.SHARE_BASE || CLIENT_ORIGIN;

const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;

function toLobbyState(lobby: LobbyRecord) {
  const { waiting: _waiting, joinCounter: _joinCounter, activeSession: _activeSession, ...state } = lobby;
  return state;
}

function buildWaitingPayload(lobby: LobbyRecord, playerId: string) {
  const waitingPosition = lobbyStore.getWaitingPosition(lobby.lobbyId, playerId) ?? 1;
  const isLobbyFull = lobby.players.length >= lobby.maxPlayers;
  const snapshot = gameSessionManager.getActiveGameSnapshot(lobby.lobbyId);
  return {
    lobbyId: lobby.lobbyId,
    waitingPosition,
    isLobbyFull,
    fullMessage: isLobbyFull ? 'Lobby full. Waiting for a slot.' : null,
    snapshot,
  };
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
  transports: ['websocket', 'polling'],
});

lobbyStore.startCleanup();

const lobbyNs = io.of('/lobby');

// Create game namespace for game session management
const gameNs = io.of('/game') as Namespace<GameClientToServerEvents, GameServerToClientEvents>;

// Initialize game orchestrator
import { createGameOrchestrator } from './game/orchestrator';
createGameOrchestrator(gameNs);

// Initialize game controller
const gameController = new GameController(gameNs);

// Wire game namespace connections
gameNs.on('connection', (socket) => {
  console.log(`GameNamespace: Player connected (socket ${socket.id})`);
  gameController.registerHandlers(socket);
});

// Wire game namespace to session manager
gameSessionManager.setGameNamespace(gameNs);

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
      socket.emit('game:waiting', buildWaitingPayload(result.state, socket.id));
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

    console.log(`Server: Game starting for lobby ${payload.lobbyId}, session ${result.session.sessionId}`);

    const lobby = lobbyStore.getState(payload.lobbyId);
    if (lobby) {
      console.log(`Server: Emitting game:started to lobby ${payload.lobbyId} with session:`, result.session);
      lobbyNs.to(payload.lobbyId).emit('game:started', result.session);
      lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(lobby));
      console.log(`Server: Calling gameSessionManager.start for lobby ${payload.lobbyId}`);
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

setInterval(() => {
  for (const lobby of lobbyStore.list()) {
    if (lobby.waiting.length === 0) continue;
    for (const waitingPlayer of lobby.waiting) {
      lobbyNs.to(waitingPlayer.id).emit('game:waiting', buildWaitingPayload(lobby, waitingPlayer.id));
    }
  }
}, 1000);

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on :${PORT}`);
});
