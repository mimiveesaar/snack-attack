import type { VirtualOpponentProfile } from '../../game/state';

export const BOT_PROFILES: Record<'easy' | 'medium' | 'hard', VirtualOpponentProfile> = {
  easy: {
    difficulty: 'easy',
    reactionIntervalMs: 200,
    targetSwitchIntervalMs: 3000,
    targetUpgradeCooldownMs: 400,
    directionChangeCooldownMs: 300,
    playerTargetCooldownMs: 3000,
    riskTolerance: 0.2,
    jitterStrength: 0.6,
  },
  medium: {
    difficulty: 'medium',
    reactionIntervalMs: 600,
    targetSwitchIntervalMs: 4500,
    targetUpgradeCooldownMs: 500,
    directionChangeCooldownMs: 350,
    playerTargetCooldownMs: 2500,
    riskTolerance: 0.5,
    jitterStrength: 0.4,
  },
  hard: {
    difficulty: 'hard',
    reactionIntervalMs: 10,
    targetSwitchIntervalMs: 3000,
    targetUpgradeCooldownMs: 100,
    directionChangeCooldownMs: 250,
    playerTargetCooldownMs: 2000,
    riskTolerance: 0.2,
    jitterStrength: 0.2,
  },
};
