# Research: Snack Attack Lobby System

## 1) Lobby state storage and lifecycle
- **Decision**: Keep lobby state in-memory on the Node socket server using Maps keyed by lobbyId; prune empty lobbies promptly.
- **Rationale**: Very small scale (<=4 players per lobby) and short-lived sessions; avoids persistence complexity and dependencies; fast iteration.
- **Alternatives considered**: Persistent DB (overkill for scope, adds dependency and ops); file-based storage (contention, cleanup complexity).

## 2) Nickname validation and deduping
- **Decision**: Enforce 1-31 alphanumeric chars; reject invalid input with inline feedback; resolve duplicates by appending incrementing suffix per base name (Alex, Alex (2), Alex (3)).
- **Rationale**: Meets requirement, predictable UX, deterministic mapping; simple to implement client+server with a single pass over lobby roster.
- **Alternatives considered**: Random suffixes (harder to remember), blocking duplicates outright (breaks requested behavior).

## 3) Leader promotion and lobby cleanup
- **Decision**: Track join order; on leader disconnect, promote next player; if no players remain, delete lobby immediately.
- **Rationale**: Matches requirement; deterministic promotion; ensures empty lobbies are reclaimed quickly.
- **Alternatives considered**: Random promotion (non-deterministic); delayed deletion (wastes resources, risks stale lobbies).

## 4) Gamemode changes and capacity enforcement
- **Decision**: Multiplayer cap = 4; Singleplayer cap = 1. When switching to Singleplayer, immediately remove non-leader players and block new joins until mode changes back.
- **Rationale**: Directly satisfies requirement; keeps state consistent and visible to all clients; minimizes edge cases.
- **Alternatives considered**: Deferred kicks (confusing), soft warnings (does not meet requirement), flexible caps (out of scope).

## 5) Active-game joiner handling
- **Decision**: Joiners during active game see waiting view with leaderboard+timer; server keeps a snapshot of active game state and enqueues joiners for next round; auto-admit when game ends if capacity allows.
- **Rationale**: Prevents disruption while keeping users engaged; deterministic re-entry; aligns with requirement.
- **Alternatives considered**: Reject joiners (poor UX), force spectate inside active game (scope creep), polling-only approach (higher latency, redundant with sockets).

## 6) Rendering and assets
- **Decision**: Fixed 430×430 container, DOM/SVG only, PNG pixel-art assets at native resolution; no runtime scaling or smoothing; center container when viewport allows.
- **Rationale**: Matches visual rules and constitutional constraints (no Canvas, desktop-first, fixed viewport); keeps layout deterministic.
- **Alternatives considered**: Responsive scaling (explicitly out of scope); Canvas (prohibited); vector assets (violates pixel-art requirement).
