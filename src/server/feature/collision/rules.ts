export const canEat = (playerRadius: number, npcRadius: number): boolean => playerRadius >= npcRadius;

export const isInGracePeriod = (now: number, graceEndTimeMs: number | null): boolean => {
  if (!graceEndTimeMs) return false;
  return now < graceEndTimeMs;
};
