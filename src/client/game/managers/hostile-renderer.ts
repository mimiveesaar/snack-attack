import { NPC, type NPCType } from '../entities/npc';
import type { Vec2D } from '../../../shared/game';

export interface NPCRenderState {
  id: string;
  type: NPCType;
  position: Vec2D;
  velocity: Vec2D;
  visualSize: number;
}

export class HostileRenderer {
  private container: SVGElement | null = null;
  private npcs: Map<string, NPC> = new Map();

  initialize(container: SVGElement): void {
    this.container = container;
    console.log('HostileRenderer: Initialized');
    console.log('HostileRenderer: Container is SVGElement?', container instanceof SVGElement);
    console.log('HostileRenderer: Container tag:', container.tagName);
    console.log('HostileRenderer: Container in DOM?', document.body.contains(container));
  }

  updateNPC(state: NPCRenderState): void {
    if (!this.container) {
      console.warn('HostileRenderer.updateNPC: Container is null');
      return;
    }

    let npc = this.npcs.get(state.id);

    if (!npc) {
      console.log(`HostileRenderer: Creating new NPC ${state.id} (type: ${state.type})`);
      npc = new NPC(state.id, state.type, state.position);
      // Render asynchronously
      npc.render(this.container).catch((error) => {
        console.error(`Failed to render NPC ${state.id}:`, error);
      });
      this.npcs.set(state.id, npc);
      console.log(`HostileRenderer: NPC created and render called for ${state.id}`);
    }

    npc.setPosition(state.position);
    npc.setVelocity(state.velocity);
    npc.setSize(state.visualSize);
  }

  removeNPC(npcId: string): void {
    const npc = this.npcs.get(npcId);
    if (npc) {
      npc.destroy();
      this.npcs.delete(npcId);
    }
  }

  updateAll(states: NPCRenderState[]): void {
    if (!this.container) {
      console.warn('HostileRenderer: Container not found');
      return;
    }

    states.forEach((state) => {
      this.updateNPC(state);
    });

    const stateIds = new Set(states.map((s) => s.id));
    const toRemove: string[] = [];
    this.npcs.forEach((_, npcId) => {
      if (!stateIds.has(npcId)) {
        toRemove.push(npcId);
      }
    });
    toRemove.forEach((id) => this.removeNPC(id));
  }

  updateFrame(deltaMs: number): void {
    this.npcs.forEach((npc) => {
      npc.update(deltaMs);
    });
  }

  clear(): void {
    this.npcs.forEach((npc) => npc.destroy());
    this.npcs.clear();
  }

  destroy(): void {
    this.clear();
    this.container = null;
  }
}
