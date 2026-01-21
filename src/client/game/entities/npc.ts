/**
 * NPC Entity - Non-player character fish
 *
 * Extends Fish with NPC-specific properties
 */

import { Fish } from './fish';
import type { Vec2D } from '../../../shared/game';

export type NPCType = 'pink' | 'grey' | 'brown';

const NPC_COLORS: Record<NPCType, string> = {
  pink: '#ff69b4',
  grey: '#808080',
  brown: '#8b4513',
};

const NPC_SIZES: Record<NPCType, number> = {
  pink: 0.45,  // Small (same size)
  grey: 0.7,   // Medium (reduced)
  brown: 0.95, // Large (reduced)
};

export class NPC extends Fish {
  private npcType: NPCType;
  private xpValue: number;

  constructor(id: string, npcType: NPCType, position: Vec2D) {
    const color = NPC_COLORS[npcType];
    const size = NPC_SIZES[npcType];

    super(id, `npc-${npcType}` as any, position, color, size);

    this.npcType = npcType;
    const xpMap: Record<NPCType, number> = { pink: 10, grey: 25, brown: 50 };
    this.xpValue = xpMap[npcType];
  }

  /**
   * Get XP value of this NPC
   */
  getXpValue(): number {
    return this.xpValue;
  }

  /**
   * Get NPC type
   */
  getNPCType(): NPCType {
    return this.npcType;
  }
}
