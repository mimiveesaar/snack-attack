import { GameSessionState } from "../../game/state";
import { GAME_BOUNDARY } from "../../../shared/config";

export class PlayerManager {

    private readonly tickIntervalMs: number;

    constructor(tickIntervalMs: number) {
        this.tickIntervalMs = tickIntervalMs;
    }

    public tick(session: GameSessionState): void {
        const state = session.getState();
        const now = Date.now();

        for (const player of state.players) {
            // Handle respawning players
            if (player.status === 'respawning' && player.respawnTimeMs && now >= player.respawnTimeMs) {
                // Find safe respawn position
                const spawnPos = this.findSafeRespawnLocation(session);
                if (spawnPos) {
                    session.completePlayerRespawn(player.id, spawnPos);
                }
                continue;
            }

            if (player.status !== 'alive') continue;

            // Update position based on velocity
            player.position.x += player.velocity.x * this.tickIntervalMs;
            player.position.y += player.velocity.y * this.tickIntervalMs;
        }
    }


    private findSafeRespawnLocation(session: GameSessionState): { x: number; y: number } | null {
        const state = session.getState();
        const SAFE_DISTANCE = 100; // pixels from any other fish
        const attempts = 20;

        for (let i = 0; i < attempts; i++) {
            const x = GAME_BOUNDARY.buffer + Math.random() * (GAME_BOUNDARY.width - 2 * GAME_BOUNDARY.buffer);
            const y = GAME_BOUNDARY.buffer + Math.random() * (GAME_BOUNDARY.height - 2 * GAME_BOUNDARY.buffer);

            let safe = true;

            // Check distance to all other alive players
            for (const player of state.players) {
                if (player.status !== 'alive') continue;
                const dx = x - player.position.x;
                const dy = y - player.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < SAFE_DISTANCE) {
                    safe = false;
                    break;
                }
            }

            // Check distance to all NPCs
            if (safe) {
                for (const npc of state.npcs) {
                    const dx = x - npc.position.x;
                    const dy = y - npc.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < SAFE_DISTANCE) {
                        safe = false;
                        break;
                    }
                }
            }

            if (safe) {
                return { x, y };
            }
        }

        // If no safe location found, return a random position anyway
        return {
            x: GAME_BOUNDARY.buffer + Math.random() * (GAME_BOUNDARY.width - 2 * GAME_BOUNDARY.buffer),
            y: GAME_BOUNDARY.buffer + Math.random() * (GAME_BOUNDARY.height - 2 * GAME_BOUNDARY.buffer),
        };
    }
}