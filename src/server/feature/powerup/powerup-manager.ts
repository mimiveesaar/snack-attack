import { GameSessionState } from "../../game/state";
import { PowerupSpawner } from "./powerup-spawner";

export class PowerupManager {

    private readonly powerupSpawner: PowerupSpawner;

    constructor() {
        this.powerupSpawner = new PowerupSpawner();
    }

    public tick(session: GameSessionState): void {
        session.cleanupExpiredPlayerPowerups();
        this.powerupSpawner.cleanupExpiredPowerups(session);

        this.powerupSpawner.tick(session);
    }
}