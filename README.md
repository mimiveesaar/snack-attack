# Snack Attack

Snack Attack is a small multiplayer browser game, inspired by Feeding Frenzy, where you control a fish, eat smaller fish to grow, and compete for the top score before the timer ends.

## Tech Stack
- Client: TypeScript + Vite + Lit
- Server: Node.js + TypeScript + Socket.IO
- Build: Vite (client + server bundles)
- Docker

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm

### Install
```bash
pnpm install
```

### Development
Run the server and client in separate terminals:
```bash
pnpm dev:server
```
```bash
pnpm dev:client
```

Client: http://localhost:5173
Server: ws://localhost:3001 (Socket.IO)

### Production Build
```bash
pnpm build:client
pnpm build:server
```

### Production Preview
```bash
pnpm start:server
pnpm start:client
```

## Configuration
Shared runtime configuration lives in src/shared/config.ts (client origin, game bounds, session settings, etc.). Server-specific settings are in src/server/config.ts.


## License
No license specified.


## Extra Features
The Lobby system which allows players to host private lobbies.

The game features 3 different power-ups:
- Speed Boost: the speed of the player increases for a period of 10 seconds.
- Double XP: every acquired XP is doubled during a 10 second period.
- Invincibility: the player cannot be eaten for a duration of 10 seconds.

The game can be played in Singleplayer mode.

Interactive NPCs.
