# snack-attack Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-17

## Active Technologies
- TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions (001-player-nickname-labels)
- In-memory Maps on the Node socket server (lobby/game session state) (001-player-nickname-labels)
- N/A (derived from existing game state) (003-player-nickname-labels)
- In-memory Maps on the Node server for lobby/game session state (no persistence) (004-pvp-fish-eating)
- localStorage (existing sound-enabled preference) (006-fish-eat-sfx)
- In-memory lobby state on server; client-side component state (no new persistence) (007-customize-singleplayer-lobby)

- TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time), pnpm-managed; prefer DOM/Web APIs (001-lobby-system)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (strict mode) on Node.js (current LTS): Follow standard conventions

## Recent Changes
- 007-customize-singleplayer-lobby: Added TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions
- 006-fish-eat-sfx: Added TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions
- 005-waiting-lobby: Added TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
