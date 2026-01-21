import { Fish } from './fish';
import type { Vec2D } from '../../../shared/game';

export type NPCType = 'pink' | 'grey' | 'brown';

const NPC_COLORS: Record<NPCType, string> = {
  pink: '#ff69b4',
  grey: '#808080',
  brown: '#8b4513',
};

export class NPC extends Fish {
  private npcType: NPCType;

  constructor(id: string, npcType: NPCType, position: Vec2D) {
    const color = NPC_COLORS[npcType];

    super(id, `npc-${npcType}` as any, position, color);

    this.npcType = npcType;
  }

  getNPCType(): NPCType {
    return this.npcType;
  }
}