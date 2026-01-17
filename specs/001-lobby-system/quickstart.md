# Quickstart: Snack Attack Lobby System

## Prerequisites
- Node.js (current LTS)
- pnpm

## Setup
1) Install deps
```bash
pnpm install
```

2) Run dev servers (socket server + client bundler)
```bash
pnpm run dev
```

3) Open the fixed-viewport lobby UI
- Navigate to the served URL (e.g., http://localhost:5173)
- The lobby container is fixed at 430×430 and centered when space allows

## Manual Validation (no automated tests)
- Create flow: load root (no lobby id), enter valid nickname/color, create lobby, observe leader status and share URL.
- Join flow: open `/lobby/{id}` in another browser/session, enter nickname (duplicate should suffix), confirm real-time roster update.
- Leader controls: switch gamemode/difficulty, confirm roster adjustments (kicks on singleplayer), copy share URL feedback, start game visibility leader-only.
- Active game joiner: start a game, join from another session, confirm waiting view with leaderboard/timer and auto-admission after game end if slot available.

## Notes
- No HTML Canvas; DOM/CSS/SVG rendering only.
- No automated testing or test infrastructure.
- Dependencies beyond Lit and Socket.IO must be justified per constitution.
