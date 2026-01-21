import { PlayerGrowthConfig } from "./game";

export const MULTIPLAYER_CAP = 4;
export const SINGLEPLAYER_CAP = 1;
export const SESSION_DURATION_MS = 60_000;
export const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;
export const CLIENT_ORIGIN = 'http://localhost:5173';
export const BASE_URL = CLIENT_ORIGIN;

export const GAME_BOUNDARY = {
    width: 600,
    height: 600,
    buffer: 20,
} as const;

export const PLAYER_GROWTH_CONFIG: PlayerGrowthConfig = {
	1: {
		growthPhase: 1,
		xpThreshold: 10,
		collisionRadius: 7,
		visualSize: 1,
	},
	2: {
		growthPhase: 2,
		xpThreshold: 20,
		collisionRadius: 10,
		visualSize: 1.2,
	},
	3: {
		growthPhase: 3,
		xpThreshold: 30,
		collisionRadius: 13,
		visualSize: 1.5,
	},
} as const;
