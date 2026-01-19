import { PowerupRenderer } from './managers/powerup-renderer';
export let powerupRenderer: PowerupRenderer | null = null;

export function getPowerupRenderer() {
  if (!powerupRenderer) powerupRenderer = new PowerupRenderer();
  return powerupRenderer;
}

export function clearPowerupRenderer() {
  if (powerupRenderer) {
    powerupRenderer.clear();
    powerupRenderer = null;
  }
}
