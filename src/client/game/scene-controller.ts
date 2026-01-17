/**
 * Scene Controller - Routes between lobby and game scenes
 *
 * Responsibilities:
 * - Manage scene transitions (lobby ↔ game)
 * - Control by server events (lobby:state → game:started)
 * - Handle scene mounting/unmounting
 * - Wire state subscriptions for rendered scene
 */

import { createGameManager, getGameManager, destroyGameManager } from './game-manager';

export type SceneType = 'lobby' | 'game' | 'waiting';

export interface SceneControllerConfig {
  lobbySceneId: string;
  gameSceneId: string;
  waitingSceneId: string;
}

export class SceneController {
  private currentScene: SceneType = 'lobby';
  private config: SceneControllerConfig;
  private listeners: Map<string, Set<(scene: SceneType) => void>> = new Map();

  constructor(config: SceneControllerConfig) {
    this.config = config;
  }

  /**
   * Get current scene
   */
  getCurrentScene(): SceneType {
    return this.currentScene;
  }

  /**
   * Route to game scene
   */
  async toGame(sessionId?: string, playerId?: string): Promise<void> {
    if (this.currentScene === 'game') return;

    console.log('SceneController: transitioning to game');
    this.hideAllScenes();
    this.showScene(this.config.gameSceneId);
    this.currentScene = 'game';
    this.notifyListeners();

    // Initialize game manager if sessionId and playerId are provided
    if (sessionId && playerId) {
      try {
        const gameManager = createGameManager();
        await gameManager.initialize(sessionId, playerId);
        console.log('SceneController: GameManager initialized');
      } catch (error) {
        console.error('SceneController: Failed to initialize GameManager:', error);
      }
    }
  }

  /**
   * Route to waiting scene (when joining mid-game lobby)
   */
  toWaiting(): void {
    if (this.currentScene === 'waiting') return;

    console.log('SceneController: transitioning to waiting');
    this.hideAllScenes();
    this.showScene(this.config.waitingSceneId);
    this.currentScene = 'waiting';
    this.notifyListeners();
  }

  /**
   * Route to lobby scene
   */
  toLobby(): void {
    if (this.currentScene === 'lobby') return;

    console.log('SceneController: transitioning to lobby');

    // Clean up game manager if transitioning from game
    if (this.currentScene === 'game') {
      destroyGameManager();
    }

    this.hideAllScenes();
    this.showScene(this.config.lobbySceneId);
    this.currentScene = 'lobby';
    this.notifyListeners();
  }

  /**
   * Subscribe to scene changes
   */
  onSceneChange(callback: (scene: SceneType) => void): () => void {
    if (!this.listeners.has('change')) {
      this.listeners.set('change', new Set());
    }
    this.listeners.get('change')!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get('change')?.delete(callback);
    };
  }

  /**
   * Hide all scenes
   */
  private hideAllScenes(): void {
    [this.config.lobbySceneId, this.config.gameSceneId, this.config.waitingSceneId].forEach((id) => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.style.display = 'none';
      }
    });
  }

  /**
   * Show scene by ID
   */
  private showScene(id: string): void {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.display = 'block';
    }
  }

  /**
   * Notify all listeners of scene change
   */
  private notifyListeners(): void {
    const callbacks = this.listeners.get('change') || new Set();
    callbacks.forEach((cb) => cb(this.currentScene));
  }
}

/**
 * Global scene controller instance
 */
let sceneController: SceneController | null = null;

export function initializeSceneController(config: SceneControllerConfig): SceneController {
  sceneController = new SceneController(config);
  return sceneController;
}

export function getSceneController(): SceneController {
  if (!sceneController) {
    throw new Error('SceneController not initialized. Call initializeSceneController first.');
  }
  return sceneController;
}
