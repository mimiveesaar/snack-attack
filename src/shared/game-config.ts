export const MULTIPLAYER_CAP = 4;
export const SINGLEPLAYER_CAP = 1;
export const SESSION_DURATION_MS = 30_000;
export const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const BASE_URL = process.env.SHARE_BASE || CLIENT_ORIGIN;
