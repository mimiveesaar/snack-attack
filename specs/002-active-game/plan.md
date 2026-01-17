# Implementation Plan: Snack Attack Active Game Mechanics

**Branch**: `002-game-development` | **Date**: 2026-01-17 | **Spec**: [specs/002-active-game/spec.md](specs/002-active-game/spec.md)

**Input**: Feature specification from `/specs/002-active-game/spec.md` and technical architecture from `game-plan.md`

## Summary

Deliver a 2-minute multiplayer fish-eating game with server-authoritative collision detection, client-side movement prediction, and real-time leaderboard synchronization. Architecture uses **manager/entity pattern** on client (renderers manage visual entities, physics manager handles interpolation) and **controller/orchestrator pattern** on server (game controller routes events, game orchestrator maintains session state, game loop provides authoritative tick). Separate `/lobby` and `/game` Socket.IO namespaces. Visual rendering via DOM/CSS/SVG with fixed 500×500 game canvas and gradient background. Client sends movement inputs every tick; server broadcasts game state (fish positions, power-ups, leaderboard) at fixed 60 FPS with deterministic collision resolution.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS); Lit for UI components
**Primary Dependencies**: Socket.IO (server + client), requestAnimationFrame for client rendering, existing types from `@shared/types`
**Storage**: In-memory game session state (server-side), leaderboard snapshot in memory
**Testing**: None (constitutional prohibition—manual validation only)
**Target Platform**: Desktop web browsers with fixed 500×500 viewport
**Rendering**: DOM/CSS/SVG only; no HTML Canvas
**Architecture Patterns**:
  - **Client**: Manager/Entity (renderers manage visual entities), Client-Side Prediction with server reconciliation
  - **Server**: Controller/Orchestrator (game controller routes, orchestrator manages state, game loop ticks)
  - **Networking**: Socket.IO rooms per game session, persistent player IDs, graceful disconnect handling
**Performance Goals**: 
  - Server tick rate: 60 Hz (fixed timestep)
  - Client frame rate: ~60 FPS (requestAnimationFrame)
  - State broadcast frequency: 10 Hz (server sends Location event every 6 ticks)
  - Network latency compensation: client-side prediction + server reconciliation + entity interpolation
**Scale/Scope**: 1-4 players per game session, ~500ms max expected latency, deterministic collision resolution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: Does design prioritize readable manager/entity pattern and clear data flows?
- **Simple UX**: Is the game UI minimal (sidebar, overlay, timer) without unnecessary chrome?
- **Minimal Dependencies**: Socket.IO + Lit only; no new game libraries (physics, rendering engines prohibited)?
- **Simple Over Abstract**: Manager/entity pattern over complex inheritance hierarchies?
- **No Testing**: Confirms no test infrastructure, fixtures, or test frameworks included?
- **Technology Stack**: Node.js + TypeScript (strict), Lit + Socket.IO, pnpm only?
- **Desktop-First Game**: Fixed 500×500 viewport, no responsive design, no mobile?
- **Rendering**: DOM/CSS/SVG only—no HTML Canvas, WebGL, or game engines?
- **Server Authoritative**: Collision detection and scoring live on server; client rendering only?

**Gate Status**: All gates expected to pass. Architecture adheres to manager/entity (not inheritance), uses only Socket.IO + Lit, fixed viewport, DOM/SVG rendering, and server-side truth. Confirm during Phase 1 that no new dependencies are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-active-game/
├── spec.md              # Feature specification (9 user stories, 13 FRs, 11 SCs)
├── plan.md              # This file
├── research.md          # Phase 0 clarifications (if any)
├── data-model.md        # Phase 1 entity definitions
├── contracts/           # Phase 1 API/event contracts
│   ├── game-events.md   # Socket.IO event schemas
│   └── game-api.yaml    # Game REST endpoints (if any)
├── quickstart.md        # Phase 1 manual validation guide
└── tasks.md             # Phase 2 task breakdown
```

### Source Code (repository root)

```text
src/
├── server/
│   ├── game/
│   │   ├── controller.ts        # Routes game events, validates inputs
│   │   ├── orchestrator.ts      # Manages active game sessions
│   │   ├── loop.ts              # Fixed 60 Hz game loop, collision resolution
│   │   ├── state.ts             # Game session state (players, NPCs, power-ups, score)
│   │   ├── collision.ts         # Collision detection and eating resolution
│   │   └── index.ts             # Registers /game namespace and wires controller
│   └── ... (existing lobby namespace)
├── client/
│   ├── game/
│   │   ├── engine.ts            # Client engine, requestAnimationFrame loop
│   │   ├── scene-controller.ts  # Routes between /lobby and /game scenes
│   │   ├── input-controller.ts  # Keyboard input handling, tick-based dispatch
│   │   ├── physics.ts           # Client-side collision checks, entity interpolation
│   │   ├── managers/
│   │   │   ├── hostile-renderer.ts    # Renders NPC + player fish (except self)
│   │   │   ├── player-renderer.ts     # Renders own player fish + respawn state
│   │   │   ├── powerup-renderer.ts    # Renders power-ups
│   │   │   └── decal-renderer.ts      # Renders bubbles, seaweed, rocks (decorative)
│   │   ├── entities/
│   │   │   ├── fish.ts          # Base visual fish entity (position, size, rotation, animation)
│   │   │   ├── visual-entity.ts  # Base class (id, position, state: spawning/alive/despawning)
│   │   │   ├── powerup.ts        # Power-up entity
│   │   │   ├── rock.ts, seaweed.ts, bubble.ts  # Decorative entities
│   │   │   └── player-fish.ts    # Player fish entity with movement state
│   │   ├── components/
│   │   │   ├── game-scene.ts     # Main game view layout (canvas + sidebar)
│   │   │   ├── game-hud.ts       # HUD overlay (timer, pause, end screen)
│   │   │   ├── sidebar.ts        # Sidebar UI (score, fish-o-meter, leaderboard)
│   │   │   ├── fish-o-meter.ts   # XP progress bar and growth indicator
│   │   │   └── leaderboard.ts    # Live ranked player list
│   │   └── index.ts              # Exports game module, initializes scene controller
│   ├── providers/
│   │   ├── engine-provider.ts    # Provides 60 TPS engine ticks to children
│   │   ├── connection-provider.ts # Provides socket.io connection to children
│   │   └── index.ts
│   └── ... (existing lobby and root components)
└── shared/
    └── ... (existing types: lobby.ts, game-session.ts, game.ts, events.ts)
```

## Technical Decisions

### Movement & Prediction
- **Client**: Calculates predicted player position based on input and deltaTime; sends input vector + timestamp to server every tick
- **Server**: Authoritative physics; resolves collisions, applies power-ups, computes eating rules, broadcasts corrected positions at 10 Hz
- **Reconciliation**: On state mismatch, client rewinds to server state and reapplies unacknowledged inputs
- **Time-based compensation**: Movement scaled by deltaTime, not ticks, to handle variable client framerates

### Rendering & Interpolation
- **Entity Interpolation**: Client stores two snapshots (current + previous) and interpolates between them for smooth motion between server updates
- **Jitter Buffer**: Hostile fish positions buffered to smooth out network inconsistencies
- **Visual-only collisions**: Bubble spawns, rock placements, seaweed are visual only and computed on client; eating and power-up collisions server-authoritative

### Networking & Sync
- **Socket.IO rooms**: Each game session is a separate room; `/game` namespace for active gameplay
- **Tick packaging**: Collision events (fish eaten) and state updates (score change) sent together in a single `game:state-update` event per server tick
- **Graceful disconnect**: Player disconnect triggers `player:disconnected` event; player fish removed, score frozen on leaderboard as "quit"
- **Clock sync**: Handshake ping/pong to calculate client→server time offset for accurate lag compensation

### Collision Resolution
- **Server-authoritative**: All eating, power-up pickup, and boundary collisions resolved on server
- **Deterministic ordering**: Multiple collisions in same tick resolved in joinOrder sequence
- **Grace period**: Respawned player immune to eating for 2s; collision checks still occur but eating is blocked

## Complexity Tracking

| Aspect | Complexity | Mitigation |
|--------|-----------|-----------|
| Network latency handling | High | Client-side prediction + reconciliation + entity interpolation minimizes perceived lag |
| Deterministic collision ordering | Medium | Server maintains joinOrder; collision loop processes in fixed order each tick |
| Entity lifecycle (spawning/despawning) | Medium | State machine per entity (spawning → alive → despawning → destroyed); managers handle cleanup |
| Power-up expiration & pause interaction | Medium | Server tracks power-up start time and pause state; duration tick only when unpaused |
| Visual/gameplay collision separation | Medium | Client physics only for rendering; server physics for score/eating—clear boundary prevents bugs |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Client can cheat by faking position | High | Server validates all eating/power-up pickups; client position is for rendering only |
| Latency spikes cause jittery movement | Medium | Jitter buffer and entity interpolation; graceful degradation at high latency |
| Server tick falling behind | Medium | Fixed timestep (16.67ms) with catch-up logic; monitor tick lag and alert if threshold exceeded |
| Player disconnect during game | Medium | Graceful disconnect handler; re-join-in-progress flow (spectate) for future |
| Power-up spawn collision with player | Low | Spawn validation ensures minimum safe distance; re-roll if collision detected |

---

## Next Steps

**Phase 0: Research & Clarification**
- Clarify exact XP thresholds for growth phases (currently assumed 50 and 150)
- Determine NPC spawn frequency (e.g., 1 Pink every 2s, 1 Grey every 5s, 1 Brown every 10s)
- Confirm max concurrent NPC counts per type (e.g., max 5 Pink, 3 Grey, 1 Brown)
- Decide power-up spawn frequency and location strategy (random? avoid players?)

**Phase 1: Design & Contracts**
- Generate data-model.md with entity schemas (Fish, GameSession, PowerUp, etc.)
- Generate contracts/game-events.md with Socket.IO event payloads
- Generate contracts/game-api.yaml with REST endpoints (if any)
- Generate quickstart.md with manual validation steps
- Update agent context with game types and managers

**Phase 2: Tasks**
- Break down into implementation tasks per user story (P1 before P2)
- Phase order: Core loop → Growth → NPCs → Respawn → Power-ups → UI → Polish
- Each task assigned to file(s) with specific acceptance criteria (manual validation, not tests)
