/**
 * Game Controller - Routes game namespace events to orchestrator/session handlers
 *
 * Responsibilities:
 * - Validate incoming events
 * - Route to appropriate handlers
 * - Error handling and logging
 * - Map socket IDs to player IDs
 */

import type { Socket, Namespace } from 'socket.io';
import type { GameClientToServerEvents, GameServerToClientEvents } from '@shared/game-events';
import { getGameSession } from './state';

export class GameController {
  private gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>;
  private socketToPlayerId: Map<string, string> = new Map();

  constructor(gameNamespace: Namespace<GameClientToServerEvents, GameServerToClientEvents>) {
    this.gameNamespace = gameNamespace;
  }

  /**
   * Register event handlers for a socket
   */
  registerHandlers(socket: Socket<GameClientToServerEvents, GameServerToClientEvents>): void {
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

    this.socketToPlayerId.set(socket.id, playerId);
    socket.data.playerId = playerId;

    console.log(`GameController: Player ${playerId} ready (socket ${socket.id})`);
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
    const { playerId } = payload;
    const sessionId = socket.rooms.values().next().value;

    if (!sessionId) {
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

    if (payload.direction.x !== 0 || payload.direction.y !== 0) {
      console.log(`GameController: Input from ${playerId}: (${payload.direction.x}, ${payload.direction.y})`);
    }
  }

  /**
   * Handle pause toggle event
   */
  private handlePauseToggle(
    socket: Socket<GameClientToServerEvents, GameServerToClientEvents>,
    payload: { playerId: string; isPaused: boolean; timestamp: number }
  ): void {
    const { playerId, isPaused } = payload;
    const sessionId = socket.rooms.values().next().value;

    if (!sessionId) {
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
    const player = state.players.find((p) => p.id === playerId);

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
    const sessionId = socket.rooms.values().next().value;

    if (!sessionId) {
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
    const player = state.players.find((p) => p.id === playerId);

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
    const playerId = this.socketToPlayerId.get(socket.id);
    if (!playerId) return;

    console.log(`GameController: Socket ${socket.id} (player ${playerId}) disconnected`);
    this.socketToPlayerId.delete(socket.id);
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
