import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { lobbyStore } from './feature/lobby/lobby-store';
import { LobbyController } from './feature/lobby/lobby-controller';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/types';

const PORT = Number(process.env.SOCKET_PORT || 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const SHARE_BASE = process.env.SHARE_BASE || CLIENT_ORIGIN;

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});


const lobbyNs = io.of('/lobby');

const lobbyController = new LobbyController(lobbyNs, SHARE_BASE);

lobbyNs.on('connection', (socket) => {
  lobbyController.register(socket);
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on :${PORT}`);
});
