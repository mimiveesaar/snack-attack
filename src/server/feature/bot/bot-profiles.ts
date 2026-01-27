import type { VirtualOpponentProfile } from '../../game/state';

export const BOT_PROFILES: Record<'easy' | 'medium' | 'hard', VirtualOpponentProfile> = {
  easy: {
    difficulty: 'easy',
    reactionIntervalMs: 500,
    targetSwitchIntervalMs: 3000,
    targetUpgradeCooldownMs: 400,
    directionChangeCooldownMs: 300,
    opponentTargetCooldownMs: 5000,
  },
  medium: {
    difficulty: 'medium',
    reactionIntervalMs: 600,
    targetSwitchIntervalMs: 4500,
    targetUpgradeCooldownMs: 500,
    directionChangeCooldownMs: 350,
    opponentTargetCooldownMs: 2500,
  },
  hard: {
    difficulty: 'hard',
    reactionIntervalMs: 10,
    targetSwitchIntervalMs: 3000,
    targetUpgradeCooldownMs: 100,
    directionChangeCooldownMs: 250,
    opponentTargetCooldownMs: 2000,
  },
};
