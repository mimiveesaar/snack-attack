export const DEFAULT_SEED = 'reef-001';

export function normalizeSeed(seed: string | null | undefined): string {
  if (!seed) {
    return DEFAULT_SEED;
  }

  const trimmed = seed.trim();
  if (!trimmed) {
    return DEFAULT_SEED;
  }

  return trimmed.normalize('NFKD');
}
