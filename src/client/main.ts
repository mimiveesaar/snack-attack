import './styles/theme.css';
import './components/app-root';
import './game/components/game-scene';
import { getSceneController, initializeSceneController } from './game/scene-controller';

// Initialize scene controller
initializeSceneController({
  lobbySceneId: 'lobby-scene',
  gameSceneId: 'game-scene',
  waitingSceneId: 'waiting-scene',
});

// if (import.meta.env.DEV) {
//   const devScene = new URLSearchParams(window.location.search).get('devScene');
//   if (devScene === 'game') {
//     void getSceneController().toGame();
//   } else if (devScene === 'waiting') {
//     getSceneController().toWaiting();
//   } else if (devScene === 'lobby') {
//     getSceneController().toLobby();
//   }
// }

const mount = document.getElementById('app');
if (mount && mount.children.length === 0) {
  const root = document.createElement('app-root');
  mount.appendChild(root);
}
