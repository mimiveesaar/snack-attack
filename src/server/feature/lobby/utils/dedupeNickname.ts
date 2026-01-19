import { Player } from '@shared/types/lobby';

export function dedupeNickname(players: Player[], nicknameBase: string): string {
  let maxSuffix = 0;
  for (const p of players) {
    if (p.nicknameBase !== nicknameBase) continue;
    const match = p.nicknameDisplay.match(/\((\d+)\)$/);
    const suffix = match ? Number(match[1]) : 1;
    maxSuffix = Math.max(maxSuffix, suffix);
  }
  return maxSuffix === 0 ? nicknameBase : `${nicknameBase} (${maxSuffix + 1})`;
}