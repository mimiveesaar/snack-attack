export function deriveShareUrl(baseUrl: string, lobbyId: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/lobby/${lobbyId}`;
}