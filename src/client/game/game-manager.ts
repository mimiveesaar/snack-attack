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
import { getPowerupRenderer, clearPowerupRenderer } from './powerup-renderer';
import { GameHUD } from './components/game-hud';
import { GameSidebar } from './components/sidebar';
import { getSceneController } from './scene-controller';
import { resetLobbyUrl } from '@client/state/router';
import { lobbyClient } from '@client/state/lobby-state';
import { soundManager } from '@client/utils/sound-manager';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:3001';

export class GameManager {
  private lastLeaderboard: Array<{
    playerId: string;
    nicknameDisplay: string;
    rank: number;
    xp: number;
    isLeader: boolean;
    status: 'active' | 'respawning' | 'spectating' | 'quit';
  }> = [];
  private socket: Socket<GameServerToClientEvents, GameClientToServerEvents> | null = null;
  private playerRenderer: PlayerRenderer | null = null;
  private hostileRenderer: HostileRenderer | null = null;
  private hud: GameHUD | null = null;
  private sidebar: GameSidebar | null = null;
  private powerupRenderer: any = null;
  private sessionId: string | null = null;
  private selfPlayerId: string | null = null;
  private running: boolean = false;
  private isPaused: boolean = false;
  private activePowerupType: string | null = null;
  private powerupCollectionTime: number = 0;
  private powerupDuration: number = 10000; // 10 seconds
  private powerupUpdateInterval: NodeJS.Timeout | null = null;
  private endScreenReturnTimeout: number | null = null;
  private endScreenCountdownInterval: number | null = null;
  private fishEatenEventCount: number = 0;
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

    // Initialize PowerupRenderer
    this.powerupRenderer = getPowerupRenderer();
    this.powerupRenderer.initialize(gameCanvas);

    // Initialize HUD
    this.hud = new GameHUD();
    overlayContainer.appendChild(this.hud);

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
      this.isPaused = true;
      if (this.hud) {
        this.hud.updatePauseState(true, payload.pausedByLeaderNickname);
      }
      if (this.sidebar) {
        this.sidebar.updatePauseState(true);
      }
    });

    // Game resumed
    this.socket.on('game:resumed', (payload) => {
      console.log('GameManager: Game resumed');
      this.isPaused = false;
      if (this.hud) {
        this.hud.updatePauseState(false, null);
      }
      if (this.sidebar) {
        this.sidebar.updatePauseState(false);
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
      if (this.sidebar && this.lastLeaderboard.length > 0) {
        const updated: typeof this.lastLeaderboard = this.lastLeaderboard.map((entry) =>
          entry.playerId === payload.playerId
            ? { ...entry, status: 'quit' }
            : entry
        );
        this.lastLeaderboard = updated;
        this.sidebar.updateLeaderboard(updated);
      }
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
        powerups: p.powerups,
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

    // Render powerups
    if (this.powerupRenderer && payload.powerups) {
      console.log('[GameManager] Updating powerups:', payload.powerups.length, 'powerups');
      this.powerupRenderer.updateAll(payload.powerups);
    }

    // Update sidebar with player score and leaderboard
    if (this.sidebar) {
      // Find self player data
      const selfPlayer = payload.players.find((p) => p.playerId === this.selfPlayerId);
      if (selfPlayer) {
        this.sidebar.updatePlayerScore(selfPlayer.xp, selfPlayer.growthPhase);
        
        // Update active powerup in sidebar with server-provided remaining time (fallback to 10s)
        if (selfPlayer.powerups && selfPlayer.powerups.length > 0) {
          const activePowerupType = selfPlayer.powerups[0];
          const remainingMs = Math.max(
            0,
            (selfPlayer.powerupEndTimeMs ?? Date.now() + 10000) - Date.now()
          );

          this.sidebar.updateActivePowerup(activePowerupType, remainingMs);
          // Sync local timer to server end time
          this.activePowerupType = activePowerupType;
          this.powerupDuration = remainingMs;
          this.powerupCollectionTime = Date.now();
          this.startPowerupTimer();
        } else {
          this.activePowerupType = null;
          this.sidebar.updateActivePowerup(null, 0);
        }
      }

      // Update leaderboard in sidebar
      this.lastLeaderboard = payload.leaderboard.map((entry) => ({
        playerId: entry.playerId,
        nicknameDisplay: entry.nicknameDisplay,
        rank: entry.rank,
        xp: entry.xp,
        isLeader: entry.isLeader,
        status: entry.status,
      }));
      this.sidebar.updateLeaderboard(this.lastLeaderboard);

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

    // Update sidebar with pause state
    if (this.sidebar) {
      this.sidebar.updatePauseState(payload.isPaused);
    }

    // Track pause state locally
    this.isPaused = payload.isPaused;

    // Process game events (collisions, powerups, respawns)
    if (payload.events && payload.events.length > 0) {
      console.log('[GameManager] Events received:', payload.events.length, 'events');
      payload.events.forEach((event, idx) => {
        console.log(`[GameManager] Event ${idx + 1}:`, event.type, event);
        if (event.type === 'fish-eaten') {
          this.fishEatenEventCount += 1;
          console.debug('[GameManager] Fish-eaten event count', {
            count: this.fishEatenEventCount,
            tick: event.tick,
            eatenFishId: event.data.eatenFishId,
            eatenPlayerId: event.data.eatenPlayerId,
            eatenByPlayerId: event.data.eatenByPlayerId,
          });
          soundManager.playEatSound();
        } else if (event.type === 'powerup-collected') {
          console.log('[GameManager] Powerup collected - playing sound', {
            powerupType: event.data.powerupType,
            collectedByPlayerId: event.data.collectedByPlayerId,
            isOwnPowerup: event.data.collectedByPlayerId === this.selfPlayerId,
          });
          soundManager.playPowerupSound();
          // Track powerup collection for timer display
          if (event.data.collectedByPlayerId === this.selfPlayerId && event.data.powerupType) {
            this.activePowerupType = event.data.powerupType;
            this.powerupCollectionTime = Date.now();
            this.startPowerupTimer();
          }
        } else if (event.type === 'respawn-complete') {
          console.log('[GameManager] Playing respawn sound');
          soundManager.playRespawnSound();
        }
      });
    }
  }

  /**
   * Start the powerup timer update interval
   */
  private startPowerupTimer(): void {
    // Clear existing interval if any
    if (this.powerupUpdateInterval) {
      clearInterval(this.powerupUpdateInterval);
    }

    // Update powerup display every 100ms
    this.powerupUpdateInterval = setInterval(() => {
      if (!this.sidebar || !this.activePowerupType) {
        clearInterval(this.powerupUpdateInterval!);
        this.powerupUpdateInterval = null;
        return;
      }

      const elapsedMs = Date.now() - this.powerupCollectionTime;
      const remainingMs = Math.max(0, this.powerupDuration - elapsedMs);

      if (remainingMs <= 0) {
        // Powerup expired
        this.sidebar.updateActivePowerup(null, 0);
        this.activePowerupType = null;
        clearInterval(this.powerupUpdateInterval!);
        this.powerupUpdateInterval = null;
      } else {
        this.sidebar.updateActivePowerup(this.activePowerupType, remainingMs);
      }
    }, 100);
  }

  /**
   * Handle engine tick (requestAnimationFrame)
   */
  private onEngineTick(deltaMs: number, tickNumber: number): void {
    if (!this.running) return;

    // Don't send input or update animations when paused
    if (this.isPaused) return;

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

    if (this.endScreenReturnTimeout !== null) {
      window.clearTimeout(this.endScreenReturnTimeout);
      this.endScreenReturnTimeout = null;
    }

    if (this.endScreenCountdownInterval !== null) {
      window.clearInterval(this.endScreenCountdownInterval);
      this.endScreenCountdownInterval = null;
    }

    // Immediately stop running to prevent any more input being sent
    this.running = false;

    // Stop engine first to halt all tick events
    const engine = getGameEngine();
    engine.stop();

    // Show end screen
    if (this.hud && this.selfPlayerId) {
      this.hud.showEndScreen(payload.winner, payload.leaderboard, this.selfPlayerId);
    }

    // Return to lobby after 10 seconds
    const endAt = Date.now() + 10000;
    if (this.hud) {
      this.hud.updateEndScreenCountdown(10000);
    }
    this.endScreenCountdownInterval = window.setInterval(() => {
      const remainingMs = endAt - Date.now();
      if (this.hud) {
        this.hud.updateEndScreenCountdown(remainingMs);
      }
      if (remainingMs <= 0 && this.endScreenCountdownInterval !== null) {
        window.clearInterval(this.endScreenCountdownInterval);
        this.endScreenCountdownInterval = null;
      }
    }, 250);

    this.endScreenReturnTimeout = window.setTimeout(() => {
      const sceneController = getSceneController();
      sceneController.toLobby();
      this.endScreenReturnTimeout = null;
    }, 10000);
  }

  /**
   * Handle pause toggle button
   */
  private onPauseToggle(): void {
    if (!this.socket || !this.sidebar) return;

    // Send the opposite of current state to toggle
    const currentPauseState = this.sidebar.getPauseState();
    console.log(`GameManager: onPauseToggle - current pause state: ${currentPauseState}`);
    this.socket.emit('game:pause-toggle', {
      playerId: this.selfPlayerId!,
      isPaused: !currentPauseState, // Toggle state
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

    // Clear powerup timer
    if (this.powerupUpdateInterval) {
      clearInterval(this.powerupUpdateInterval);
      this.powerupUpdateInterval = null;
    }

    if (this.endScreenReturnTimeout !== null) {
      window.clearTimeout(this.endScreenReturnTimeout);
      this.endScreenReturnTimeout = null;
    }

    if (this.endScreenCountdownInterval !== null) {
      window.clearInterval(this.endScreenCountdownInterval);
      this.endScreenCountdownInterval = null;
    }

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
    if (this.powerupRenderer) {
      this.powerupRenderer.clear();
      this.powerupRenderer = null;
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
