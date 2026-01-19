# snack-attack Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-17

## Active Technologies
- TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions (001-initial-game-view)
- N/A (client-only rendering, no persistence required) (001-initial-game-view)
- TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication); no new dependencies (001-player-movement)
- In-memory server state (game sessions, player connections) only (001-multiplayer-server)

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
- 001-multiplayer-server: Added TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions
- 001-player-movement: Added TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication); no new dependencies
- 001-initial-game-view: Added TypeScript (strict mode) on Node.js (current LTS) + Lit (web components), Socket.IO (real-time communication) + minimal justified additions


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
