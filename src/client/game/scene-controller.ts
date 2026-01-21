import { createGameManager, destroyGameManager } from './game-manager';

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

  getCurrentScene(): SceneType {
    return this.currentScene;
  }

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

  toWaiting(): void {
    if (this.currentScene === 'waiting') return;

    console.log('SceneController: transitioning to waiting');
    this.hideAllScenes();
    this.showScene(this.config.waitingSceneId);
    this.currentScene = 'waiting';
    this.notifyListeners();
  }

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

  private hideAllScenes(): void {
    [this.config.lobbySceneId, this.config.gameSceneId, this.config.waitingSceneId].forEach((id) => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.style.display = 'none';
      }
    });
  }

  private showScene(id: string): void {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.display = 'block';
    }
  }

  private notifyListeners(): void {
    const callbacks = this.listeners.get('change') || new Set();
    callbacks.forEach((cb) => cb(this.currentScene));
  }
}


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
