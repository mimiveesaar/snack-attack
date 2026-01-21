import { GameSessionState } from "../../game/state";
import { NPCSpawner } from "./npc-spawner";

export class NPCManager {

    private readonly tickIntervalMs: number;
    private readonly npcSpawner : NPCSpawner;

    constructor(tickIntervalMs: number) {
        this.npcSpawner = new NPCSpawner();
        this.tickIntervalMs = tickIntervalMs;
    }

    public tick(session: GameSessionState): void {
        const state = session.getState();
    
    this.npcSpawner.tick(session);

    for (const npc of state.npcs) {
      if (npc.velocity.x === 0 && npc.velocity.y === 0) {
        const direction = Math.random() < 0.5 ? 1 : -1; // Random left or right
        const speed = 5 + Math.random() * 3; // 5-8 pixels per second
        npc.velocity.x = direction * (speed / 1000) * this.tickIntervalMs;
        npc.velocity.y = (Math.random() - 0.5) * 2 * (speed / 1000) * this.tickIntervalMs * 0.3; // Small vertical drift
      }

      npc.position.x += npc.velocity.x * this.tickIntervalMs;
      npc.position.y += npc.velocity.y * this.tickIntervalMs;

      // Occasionally change direction (2% chance per tick for smooth movement)
      if (Math.random() < 0.02) {
        if (Math.random() < 0.8) {
          // Horizontal swimming
          const direction = Math.random() < 0.5 ? 1 : -1;
          const speed = 5 + Math.random() * 3; // 5-8 pixels per second
          npc.velocity.x = direction * (speed / 1000) * this.tickIntervalMs;
          npc.velocity.y = (Math.random() - 0.5) * 2 * (speed / 1000) * this.tickIntervalMs * 0.3;
        } else {
          // Swim in other directions
          const angle = Math.random() * Math.PI * 2;
          const speed = 5 + Math.random() * 3;
          npc.velocity.x = Math.cos(angle) * (speed / 1000) * this.tickIntervalMs;
          npc.velocity.y = Math.sin(angle) * (speed / 1000) * this.tickIntervalMs;
        }
      }
    }

    // Clean up old despawned NPCs
    state.npcs = state.npcs.filter((npc: any) => npc.status !== 'destroyed');
  }
}