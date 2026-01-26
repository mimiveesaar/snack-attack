import type { VirtualOpponentProfile } from '../../game/state';

export const BOT_PROFILES: Record<'easy' | 'medium' | 'hard', VirtualOpponentProfile> = {
  easy: {
    difficulty: 'easy',
    reactionIntervalMs: 900,
    targetSwitchIntervalMs: 6000,
    riskTolerance: 0.8,
    jitterStrength: 0.6,
  },
  medium: {
    difficulty: 'medium',
    reactionIntervalMs: 600,
    targetSwitchIntervalMs: 4500,
    riskTolerance: 0.5,
    jitterStrength: 0.4,
  },
  hard: {
    difficulty: 'hard',
    reactionIntervalMs: 350,
    targetSwitchIntervalMs: 3000,
    riskTolerance: 0.2,
    jitterStrength: 0.2,
  },
};
