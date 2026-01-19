export function getLobbyIdFromUrl(): string | null {
  const match = window.location.pathname.match(/\/lobby\/([A-Za-z0-9-]+)/);
  return match ? match[1] : null;
}

export function isGameRoute(): boolean {
  return window.location.pathname === '/game';
}

export function getSeedFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed');
  return seed && seed.trim().length > 0 ? seed : null;
}

export function setLobbyUrl(lobbyId: string): void {
  const next = `/lobby/${lobbyId}`;
  if (window.location.pathname !== next) {
    window.history.replaceState({}, '', next);
  }
}

export function resetLobbyUrl(): void {
  if (window.location.pathname.startsWith('/lobby/')) {
    window.history.replaceState({}, '', '/');
  }
}
