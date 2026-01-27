import { PowerupSpawnConfig } from "../shared/game";

export const LOBBY_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export const BOT_PATHFINDING_CONFIG = {
  cellSize: 20,
  maxIterations: 2400,
  allowDiagonal: true,
  hazardPenalty: 6,
} as const;


export const NPC_SPAWN_CONFIG = {
	types: {
		pink: {
			intervalMs: 1500,
			maxConcurrent: 35,
			xp: 10,
			collisionRadius: 6,
			visualSize: 0.4,
			swarm: {
				size: 3,
				radius: 40,
			},
		},
		grey: {
			intervalMs: 5000,
			maxConcurrent: 10,
			xp: 25,
			collisionRadius: 9,
			visualSize: 0.8,
			swarm: {
				size: 1,
				radius: 0,
			},
		},
		brown: {
			intervalMs: 10000,
			maxConcurrent: 8,
			xp: 50,
			collisionRadius: 12,
			visualSize: 0.95,
			swarm: {
				size: 1,
				radius: 0,
			},
		},
	},
	spawn: {
		minDistanceFromPlayers: 50,
		boundaryBuffer: 20,
		bounds: {
			width: 600,
			height: 600,
		},
		maxAttempts: 10,
	},
} as const;

export const POWERUP_SPAWN_CONFIG: PowerupSpawnConfig = {
  spawnIntervalMs: 5000,
  maxConcurrentPowerups: 2,
  powerupLifetimeMs: 10000,
  spawnDistance: 50,
  despawnGraceMs: 500,
  collisionRadius: 12,
} as const;