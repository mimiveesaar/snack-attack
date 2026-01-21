import { buffer } from "stream/consumers";

export const MULTIPLAYER_CAP = 4;
export const SINGLEPLAYER_CAP = 1;
export const SESSION_DURATION_MS = 30_000;
export const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const BASE_URL = process.env.SHARE_BASE || CLIENT_ORIGIN;

export const GAME_BOUNDARY = {
    width: 600,
    height: 600,
    buffer: 20,
} as const;

export const NPC_SPAWN_CONFIG = {
	types: {
		pink: {
			intervalMs: 2500, 
			maxConcurrent: 15, 
			xp: 10,
			collisionRadius: 6,
			visualSize: 0.45,
			swarm: {
				size: 3, 
				radius: 40, 
			},
		},
		grey: {
			intervalMs: 5000,
			maxConcurrent: 5, 
			xp: 25,
			collisionRadius: 9,
			visualSize: 2,
			swarm: {
				size: 1,
				radius: 0,
			},
		},
		brown: {
			intervalMs: 10000, 
			maxConcurrent: 3, 
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
