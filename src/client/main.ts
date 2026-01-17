import './styles/theme.css';
import './components/app-root';

const mount = document.getElementById('app');
if (mount && mount.children.length === 0) {
  const root = document.createElement('app-root');
  mount.appendChild(root);
}
