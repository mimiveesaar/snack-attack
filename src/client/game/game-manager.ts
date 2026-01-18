/**
 * GameManager - Client-side game session coordinator
 *
 * Responsibilities:
 * - Initialize all game systems (engine, renderers, input)
 * - Subscribe to game:state-update events from server
 * - Coordinate between server state and client rendering
 * - Handle game lifecycle (start, pause, end)
 * - Clean up resources on game end
 */

import { io, Socket } from 'socket.io-client';
import type { GameStateUpdatePayload, GameServerToClientEvents, GameClientToServerEvents } from '@shared/game-events';
import { getGameEngine } from './engine';
import { getInputController } from './input-controller';
import { PlayerRenderer } from './managers/player-renderer';
import { HostileRenderer } from './managers/hostile-renderer';
import { GameHUD } from './components/game-hud';
import { GameSidebar } from './components/sidebar';
import { getSceneController } from './scene-controller';
import { resetLobbyUrl } from '@client/state/router';
import { lobbyClient } from '@client/state/lobby-state';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:3001';

export class GameManager {
  private socket: Socket<GameServerToClientEvents, GameClientToServerEvents> | null = null;
  private playerRenderer: PlayerRenderer | null = null;
  private hostileRenderer: HostileRenderer | null = null;
  private hud: GameHUD | null = null;
  private sidebar: GameSidebar | null = null;
  private sessionId: string | null = null;
  private selfPlayerId: string | null = null;
  private running: boolean = false;
  leaderboard: any;

  /**
   * Initialize the game session
   */
  async initialize(sessionId: string, playerId: string): Promise<void> {
    console.log(`GameManager: Initializing session ${sessionId} for player ${playerId}`);
    console.log(`GameManager: Socket server URL: ${SOCKET_SERVER}/game`);

    this.sessionId = sessionId;
    this.selfPlayerId = playerId;

    // Connect to game namespace
    this.socket = io(`${SOCKET_SERVER}/game`, {
      auth: { playerId, sessionId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    console.log('GameManager: Socket created with auth:', { playerId, sessionId });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout after 10 seconds'));
      }, 10000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        console.log('GameManager: Connected to /game namespace');
        resolve();
      });
      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('GameManager: Connection error:', error);
        reject(error);
      });
    });

    // Join game room
    console.log('GameManager: Emitting game:player-ready with playerId:', playerId);
    this.socket.emit('game:player-ready', {
      playerId,
      timestamp: Date.now(),
    });

    // Get container elements
    const gameCanvas = document.getElementById('game-canvas');
    const overlayContainer = document.getElementById('game-overlay');
    const sidebarContainer = document.getElementById('sidebar');

    if (!gameCanvas || !overlayContainer || !sidebarContainer) {
      throw new Error('GameManager: Required DOM elements not found');
    }

    // Verify game canvas is SVG
    if (!(gameCanvas instanceof SVGElement)) {
      throw new Error('GameManager: game-canvas must be an SVG element');
    }

    // Initialize renderers
    this.playerRenderer = new PlayerRenderer();
    this.playerRenderer.initialize(gameCanvas, playerId);

    this.hostileRenderer = new HostileRenderer();
    this.hostileRenderer.initialize(gameCanvas);

    // Initialize HUD
    this.hud = new GameHUD();
    overlayContainer.appendChild(this.hud);

    // Wire HUD events
    this.hud.addEventListener('play-again', () => {
      this.onPlayAgain();
    });

    this.hud.addEventListener('leave-game', () => {
      this.onLeaveGame();
    });

    // Initialize sidebar - clear old sidebar first
    sidebarContainer.innerHTML = '';
    this.sidebar = new GameSidebar();
    sidebarContainer.appendChild(this.sidebar);

    // Wire sidebar events
    this.sidebar.addEventListener('pause-toggle', () => {
      this.onPauseToggle();
    });

    this.sidebar.addEventListener('quit-game', () => {
      this.onLeaveGame();
    });

    // Subscribe to server events
    this.setupEventListeners();

    // Initialize game engine
    const engine = getGameEngine();
    engine.onTick({
      onTick: (deltaMs: number, tickNumber: number) => {
        this.onEngineTick(deltaMs, tickNumber);
      },
    });
    engine.start();

    // Initialize input controller
    const inputController = getInputController();
    // Note: direction change listener is still registered but not used for sending input
    // Input is now sent every engine tick for continuous movement

    this.running = true;
    console.log('GameManager: Initialization complete');
    console.log('GameManager: Canvas element exists?', !!gameCanvas);
    console.log('GameManager: PlayerRenderer container:', this.playerRenderer?.['container']);
    console.log('GameManager: HostileRenderer container:', this.hostileRenderer?.['container']);

    // Handle window resize for responsive gameplay
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Handle window resize - triggers renderer updates if needed
   */
  private onWindowResize(): void {
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas instanceof SVGElement) {
      // Force renderer redraw on next tick
      // The SVG viewBox stays at 800x800, but physical size changes
      console.log('GameManager: Window resized, canvas size:', {
        width: gameCanvas.clientWidth,
        height: gameCanvas.clientHeight,
      });
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) {
      console.error('GameManager: setupEventListeners called but socket is null');
      return;
    }

    console.log('GameManager: Setting up event listeners');

    // State updates from server
    this.socket.on('game:state-update', (payload) => {
      this.onStateUpdate(payload);
    });

    // Timer ticks
    this.socket.on('game:timer-tick', (payload) => {
      if (this.hud) {
        this.hud.updateTimer(payload.timerRemainingMs);
      }
    });

    // Game paused
    this.socket.on('game:paused', (payload) => {
      console.log('GameManager: Game paused');
      if (this.hud) {
        this.hud.updatePauseState(true, payload.pausedByLeaderNickname);
      }
    });

    // Game resumed
    this.socket.on('game:resumed', (payload) => {
      console.log('GameManager: Game resumed');
      if (this.hud) {
        this.hud.updatePauseState(false, null);
      }
    });

    // Game ended
    this.socket.on('game:ended', (payload) => {
      console.log('GameManager: Game ended');
      this.onGameEnded(payload);
    });

    // Player disconnected
    this.socket.on('game:player-disconnected', (payload) => {
      console.log(`GameManager: Player ${payload.playerId} disconnected`);
    });

    // Errors
    this.socket.on('game:error', (payload) => {
      console.error('GameManager: Server error:', payload.message);
    });
  }

  /**
   * Handle state update from server
   */
  private onStateUpdate(payload: GameStateUpdatePayload): void {
    if (!this.running) {
      console.warn('GameManager.onStateUpdate: Not running');
      return;
    }

    // Update player renderer with type conversion
    if (this.playerRenderer) {
      const playerRenderStates = payload.players.map((p) => ({
        playerId: p.playerId,
        position: p.position,
        velocity: p.velocity,
        color: p.color,
        nicknameDisplay: p.nicknameDisplay,
        xp: p.xp,
        growthPhase: p.growthPhase,
        visualSize: p.visualSize,
        status: p.status,
      }));
      this.playerRenderer.updateAll(playerRenderStates);
    } else {
      console.error('GameManager: playerRenderer is null');
    }

    // Update hostile renderer with type conversion
    if (this.hostileRenderer) {
      const npcRenderStates = payload.npcs.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        velocity: n.velocity,
        visualSize: n.visualSize,
      }));
      this.hostileRenderer.updateAll(npcRenderStates);
    } else {
      console.error('GameManager: hostileRenderer is null');
    }

    // Update sidebar with player score and leaderboard
    if (this.sidebar) {
      // Find self player data
      const selfPlayer = payload.players.find((p) => p.playerId === this.selfPlayerId);
      if (selfPlayer) {
        this.sidebar.updatePlayerScore(selfPlayer.xp, selfPlayer.growthPhase);
      }

      // Update leaderboard in sidebar
      this.sidebar.updateLeaderboard(
        payload.leaderboard.map((entry) => ({
          playerId: entry.playerId,
          nicknameDisplay: entry.nicknameDisplay,
          rank: entry.rank,
          xp: entry.xp,
          isLeader: entry.isLeader,
          status: entry.status,
        }))
      );

      // Check if current player is the leader
      const selfEntry = payload.leaderboard.find((entry) => entry.playerId === this.selfPlayerId);
      if (selfEntry) {
        this.sidebar.setIsLeader(selfEntry.isLeader);
      }
    }

    // Update HUD with timer and pause state
    if (this.hud) {
      this.hud.updateTimer(payload.timerRemainingMs);
      this.hud.updatePauseState(payload.isPaused, payload.pausedByLeaderNickname);
      
      // Check if current player is the leader
      const selfEntry = payload.leaderboard.find((entry) => entry.playerId === this.selfPlayerId);
      if (selfEntry) {
        this.hud.setIsLeader(selfEntry.isLeader);
      }
    }
  }

  /**
   * Handle engine tick (requestAnimationFrame)
   */
  private onEngineTick(deltaMs: number, tickNumber: number): void {
    if (!this.running) return;

    // Send current input state every tick for continuous movement
    const inputController = getInputController();
    const direction = inputController.getDirection();
    
    // Only send input if game is still running and socket is connected
    if (this.socket && this.socket.connected && this.selfPlayerId && this.running) {
      this.socket.emit('game:player-input', {
        playerId: this.selfPlayerId,
        direction,
        timestamp: Date.now(),
        tick: tickNumber,
      });
    }

    // Update visual animations
    if (this.playerRenderer) {
      this.playerRenderer.updateFrame(deltaMs);
    }

    if (this.hostileRenderer) {
      this.hostileRenderer.updateFrame(deltaMs);
    }
  }

  /**
   * Handle game ended event
   */
  private onGameEnded(payload: any): void {
    console.log('GameManager: Game ended', payload);

    // Immediately stop running to prevent any more input being sent
    this.running = false;

    // Stop engine first to halt all tick events
    const engine = getGameEngine();
    engine.stop();

    // Show end screen
    if (this.hud && this.selfPlayerId) {
      this.hud.showEndScreen(payload.winner, payload.leaderboard, this.selfPlayerId);
    }
  }

  /**
   * Handle pause toggle button
   */
  private onPauseToggle(): void {
    if (!this.socket) return;

    this.socket.emit('game:pause-toggle', {
      playerId: this.selfPlayerId!,
      isPaused: false, // Will be toggled by server
      timestamp: Date.now(),
    });
  }

  /**
   * Handle play again button - returns to lobby
   */
  private onPlayAgain(): void {
    console.log('GameManager: Play again - returning to lobby');
    const sceneController = getSceneController();
    sceneController.toLobby();
  }

  /**
   * Handle leave game button - returns to lobby
   */
  private onLeaveGame(): void {
    console.log('GameManager: Leaving game - returning to lobby entry');
    lobbyClient.leaveLobby();
    resetLobbyUrl();
    const sceneController = getSceneController();
    sceneController.toLobby();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('GameManager: Cleaning up');

    this.running = false;

    // Remove resize listener
    window.removeEventListener('resize', () => this.onWindowResize());

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clean up renderers
    if (this.playerRenderer) {
      this.playerRenderer.clear();
      this.playerRenderer = null;
    }

    if (this.hostileRenderer) {
      this.hostileRenderer.clear();
      this.hostileRenderer = null;
    }

    // Remove DOM elements
    if (this.hud) {
      this.hud.remove();
      this.hud = null;
    }

    if (this.leaderboard) {
      this.leaderboard.remove();
      this.leaderboard = null;
    }

    this.sessionId = null;
    this.selfPlayerId = null;
  }
}

// Singleton instance
let gameManager: GameManager | null = null;

export function createGameManager(): GameManager {
  gameManager = new GameManager();
  return gameManager;
}

export function getGameManager(): GameManager | null {
  return gameManager;
}

export function destroyGameManager(): void {
  if (gameManager) {
    gameManager.cleanup();
    gameManager = null;
  }
}
