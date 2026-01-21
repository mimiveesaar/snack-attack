import { createServer } from 'node:http';
import { Server, Namespace } from 'socket.io';

import { lobbyController } from './feature/lobby/lobby-controller';
import { gameSessionManager } from './feature/session/session-manager';
import { ClientToServerEvents, ServerToClientEvents, GameClientToServerEvents, GameServerToClientEvents } from '../shared/types';
import { GameController } from './game/controller';
import { createGameOrchestrator } from './game/orchestrator';
import { CLIENT_ORIGIN } from '../shared/config';

const PORT = Number(process.env.SOCKET_PORT || 3001);


const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
  transports: ['websocket', 'polling'],
});


const lobbyNamespace = io.of('/lobby');

// Create game namespace for game session management
const gameNamespace = io.of('/game') as Namespace<GameClientToServerEvents, GameServerToClientEvents>;

// Initialize game orchestrator
createGameOrchestrator(gameNamespace);

// Initialize game controller
const gameController = new GameController(gameNamespace);

// Wire game namespace connections
gameNamespace.on('connection', (socket) => {
  console.log(`GameNamespace: Player connected (socket ${socket.id})`);
  gameController.registerHandlers(socket);
});

// Wire game namespace to session manager
gameSessionManager.setGameNamespace(gameNamespace);

lobbyController.registerHandlers({
  lobbyNamespace: lobbyNamespace,
  gameSession: gameSessionManager
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on :${PORT}`);
});
