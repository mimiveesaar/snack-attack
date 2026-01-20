# Quickstart: Player Nickname Labels

## Prerequisites
- Node.js (current LTS)
- pnpm

## Setup
1) Install dependencies
```bash
pnpm install
```

2) Run dev servers
```bash
pnpm run dev
```

## Manual Validation (no automated tests)
- Start a multiplayer session with two or more players.
- Confirm each player fish shows a white nickname label above it.
- Move players around; labels should follow positions and remain above fish.
- Use a long nickname (>= 15 chars); verify label is truncated and remains readable.
- Move a player near the top boundary; label remains visible (no clipping).
