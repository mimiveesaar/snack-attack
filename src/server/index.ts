import { createServer } from 'node:http';
import { Server, Namespace } from 'socket.io';

import { lobbyController } from './feature/lobby/lobbyController';
import { lobbyStore } from './feature/lobby/lobbyStore';
import { gameSessionManager } from './game/gameSessionManager';
import { ClientToServerEvents, ServerToClientEvents, GameClientToServerEvents, GameServerToClientEvents } from '../shared/types';
import { GameController } from './game/controller';
import { createGameOrchestrator } from './game/orchestrator';
import { CLIENT_ORIGIN } from '../shared/config';

const PORT = Number(process.env.SOCKET_PORT || 3001);

const LOBBY_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
  transports: ['websocket', 'polling'],
});

setInterval(() => lobbyStore.cleanupEmptyLobbies(), LOBBY_CLEANUP_INTERVAL_MS);

const lobbyNs = io.of('/lobby');

// Create game namespace for game session management
const gameNs = io.of('/game') as Namespace<GameClientToServerEvents, GameServerToClientEvents>;

// Initialize game orchestrator
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

lobbyController.registerHandlers({
  lobbyNamespace: lobbyNs,
  gameSession: gameSessionManager
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on :${PORT}`);
});
