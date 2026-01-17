import './styles/theme.css';
import './components/app-root';
import './game/components/game-scene';
import { initializeSceneController } from './game/scene-controller';

// Initialize scene controller
initializeSceneController({
  lobbySceneId: 'lobby-scene',
  gameSceneId: 'game-scene',
  waitingSceneId: 'waiting-scene',
});

const mount = document.getElementById('app');
if (mount && mount.children.length === 0) {
  const root = document.createElement('app-root');
  mount.appendChild(root);
}
