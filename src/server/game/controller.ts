import type { Socket, Namespace } from 'socket.io';

import { getGameSession, getAllGameSessions } from './sessionStore';
import { GameClientToServerEvents, GameServerToClientEvents } from '../../shared/game-events';

export class GameController {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
  private socketToPlayerId: Map<string, string> = new Map();

  constructor(gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>) {
    this.gameNamespace = gameNamespace;
  }

  registerHandlers(socket: Socket<GameClientToServerEvents, GameServerToClientEvents>): void {
    // Store session ID from auth
    const sessionId = (socket.handshake.auth as any)?.sessionId;
    const playerId = (socket.handshake.auth as any)?.playerId;
    console.log(`GameController: Socket ${socket.id} connecting with auth:`, { sessionId, playerId });
    
    if (sessionId) {
      socket.data.sessionId = sessionId;
      console.log(`GameController: Socket ${socket.id} stored sessionId: ${sessionId}`);
      
      // Check if session exists at connection time
      const session = getGameSession(sessionId);
      if (session) {
        console.log(`GameController: Session ${sessionId} exists at connection time`);
      } else {
        console.error(`GameController: Session ${sessionId} NOT FOUND at connection time!`);
      }
    } else {
      console.warn(`GameController: Socket ${socket.id} connected without sessionId in auth`);
    }

    socket.on('game:player-ready', (payload) => {
      this.handlePlayerReady(socket, payload);
    });

    socket.on('game:player-input', (payload) => {
      this.handlePlayerInput(socket, payload);
    });

    socket.on('game:pause-toggle', (payload) => {
      this.handlePauseToggle(socket, payload);
    });

    socket.on('game:player-quit', (payload) => {
      this.handlePlayerQuit(socket, payload);
    });

    socket.on('game:sync-request', (payload) => {
      this.handleClockSyncRequest(socket, payload);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle player ready event
   */
  private handlePlayerReady(
    socket: Socket<GameClientToServerEvents, GameServerToClientEvents>,
    payload: { playerId: string; timestamp: number }
  ): void {
    const { playerId } = payload;
    const sessionId = socket.data.sessionId;

    this.socketToPlayerId.set(socket.id, playerId);
    socket.data.playerId = playerId;

    console.log(`GameController: Player ${playerId} ready (socket ${socket.id})`);
    
    if (sessionId) {
      socket.join(sessionId);
      console.log(`GameController: Player ${playerId} joined session room ${sessionId}`);
      console.log(`GameController: Socket rooms after join:`, Array.from(socket.rooms));
      
      // Verify session exists
      const session = getGameSession(sessionId);
      if (session) {
        console.log(`GameController: Session ${sessionId} found with ${session.getState().players.length} players`);
      } else {
        console.error(`GameController: Session ${sessionId} NOT FOUND after player ready!`);
      }
    } else {
      console.warn(`GameController: No sessionId for player ${playerId}`);
    }
  }

  /**
   * Handle player input event
   */
  private handlePlayerInput(
    socket: Socket<GameClientToServerEvents, GameServerToClientEvents>,
    payload: {
      playerId: string;
      direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 };
      timestamp: number;
      tick: number;
    }
  ): void {
    const { playerId, direction } = payload;
    const sessionId = socket.data.sessionId;

    if (!sessionId) {
      console.error(`GameController: handlePlayerInput - No sessionId in socket.data for player ${playerId}`);
      socket.emit('game:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Not in a game session',
        timestamp: Date.now(),
      });
      return;
    }

    const session = getGameSession(sessionId);
    if (!session) {
      socket.emit('game:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Game session not found',
        timestamp: Date.now(),
      });
      return;
    }

    // Apply player input to game state
    session.applyPlayerInput(playerId, direction);
  }

  /**
   * Handle pause toggle event
   */
  private handlePauseToggle(
    socket: Socket<GameClientToServerEvents, GameServerToClientEvents>,
    payload: { playerId: string; isPaused: boolean; timestamp: number }
  ): void {
    const { playerId, isPaused } = payload;
    const sessionId = socket.data.sessionId;

    if (!sessionId) {
      console.error(`GameController: handlePauseToggle - No sessionId in socket.data for player ${playerId}`);
      socket.emit('game:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Not in a game session',
        timestamp: Date.now(),
      });
      return;
    }

    const session = getGameSession(sessionId);
    if (!session) {
      socket.emit('game:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Game session not found',
        timestamp: Date.now(),
      });
      return;
    }

    const state = session.getState();
    const player = state.players.find((p: { id: string; }) => p.id === playerId);

    if (!player) {
      socket.emit('game:error', {
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found in session',
        timestamp: Date.now(),
      });
      return;
    }

    if (!player.isLeader) {
      socket.emit('game:error', {
        code: 'NOT_LEADER',
        message: 'Only leader can pause',
        timestamp: Date.now(),
      });
      return;
    }

    if (isPaused) {
      session.pauseGame(playerId);
      this.gameNamespace.to(sessionId).emit('game:paused', {
        pausedByLeaderId: playerId,
        pausedByLeaderNickname: player.nicknameDisplay,
        timestamp: Date.now(),
      });
    } else {
      session.resumeGame();
      this.gameNamespace.to(sessionId).emit('game:resumed', {
        resumedByLeaderId: playerId,
        resumedByLeaderNickname: player.nicknameDisplay,
        timestamp: Date.now(),
      });
    }

    console.log(`GameController: Player ${playerId} toggled pause to ${isPaused}`);
  }

  /**
   * Handle player quit event
   */
  private handlePlayerQuit(
    socket: Socket<GameClientToServerEvents, GameServerToClientEvents>,
    payload: { playerId: string; timestamp: number }
  ): void {
    const { playerId } = payload;
    const sessionId = socket.data.sessionId;

    if (!sessionId) {
      console.error(`GameController: handlePlayerQuit - No sessionId in socket.data for player ${playerId}`);
      socket.emit('game:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Not in a game session',
        timestamp: Date.now(),
      });
      return;
    }

    const session = getGameSession(sessionId);
    if (!session) {
      socket.emit('game:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Game session not found',
        timestamp: Date.now(),
      });
      return;
    }

    const state = session.getState();
    const player = state.players.find((p: { id: string; }) => p.id === playerId);

    if (!player) {
      socket.emit('game:error', {
        code: 'PLAYER_NOT_FOUND',
        message: 'Player not found in session',
        timestamp: Date.now(),
      });
      return;
    }

    session.markPlayerQuit(playerId);

    this.gameNamespace.to(sessionId).emit('game:player-disconnected', {
      playerId,
      nicknameDisplay: player.nicknameDisplay,
      reason: 'quit',
      timestamp: Date.now(),
    });

    console.log(`GameController: Player ${playerId} quit`);
  }

  /**
   * Handle clock sync request
   */
  private handleClockSyncRequest(
    socket: Socket<GameClientToServerEvents, GameServerToClientEvents>,
    payload: { clientTimestamp: number }
  ): void {
    socket.emit('game:sync-response', {
      clientTimestamp: payload.clientTimestamp,
      serverTimestamp: Date.now(),
    });
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket<GameClientToServerEvents, GameServerToClientEvents>): void {
    const playerId = this.socketToPlayerId.get(socket.id) ?? socket.data.playerId;
    const sessionId = socket.data.sessionId;
    if (!playerId || !sessionId) return;

    console.log(`GameController: Socket ${socket.id} (player ${playerId}) disconnected`);
    this.socketToPlayerId.delete(socket.id);

    const session = getGameSession(sessionId);
    if (!session) return;

    const state = session.getState();
    const player = state.players.find((p: { id: string; }) => p.id === playerId);
    if (!player || player.status === 'quit') return;

    session.markPlayerQuit(playerId);

    this.gameNamespace.to(sessionId).emit('game:player-disconnected', {
      playerId,
      nicknameDisplay: player.nicknameDisplay,
      reason: 'quit',
      timestamp: Date.now(),
    });
  }
}

let gameController: GameController | null = null;

export function createGameController(
  gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>
): GameController {
  gameController = new GameController(gameNamespace);
  return gameController;
}

export function getGameController(): GameController | null {
  return gameController;
}
