# Implementation Plan: Player Movement (Client)

**Branch**: `003-player-movement` | **Date**: 19 January 2026 | **Spec**: [specs/003-player-movement/spec.md](specs/003-player-movement/spec.md)
**Input**: Feature specification from /specs/003-player-movement/spec.md

## Summary

Implement a client-side, fixed-timestep movement loop driven by `requestAnimationFrame`, add a base fish entity that renders with provided assets, and wire a player controller to translate WASD/arrow input into deterministic acceleration/drag movement capped at a 45° vertical angle. Rendering stays DOM-based with transform updates for smooth motion and future networking alignment.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication); no new dependencies
**Storage**: N/A
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (Vite client + Node server)  
**Performance Goals**: 60 FPS rendering with 60 TPS fixed-step movement; input response <100 ms  
**Constraints**: Fixed step = 0.0167s, cap catch-up to 5 steps/frame, clamp frame delta to 0.25s, vertical angle ≤ 45°, use provided fish assets  
**Scale/Scope**: Single local player controlling one fish entity (client-only for this phase)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: Does the design prioritize readable, explicit implementations?
- **Simple UX**: Is the user experience minimal and intuitive?
- **Minimal Dependencies**: Are dependencies justified and unavoidable?
- **Simple Over Abstract**: Does the design avoid premature abstractions?
- **No Testing**: Confirms no test infrastructure, test files, or testing frameworks included
- **Technology Stack**: Node.js, TypeScript (strict mode), Lit, Socket.IO, pnpm exclusively?
- **Desktop-First Game**: Fixed viewport, no responsive design, no mobile support?
- **Rendering**: DOM/CSS/SVG only—no HTML Canvas usage?
 
**Result**: Pass on all checks.

## Project Structure

### Documentation (this feature)

```text
specs/001-player-movement/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)
```text
src/
├── client/
│   ├── feature/
│   │   ├── engine/
│   │   │   └── game-loop.ts          # new fixed timestep engine
│   │   ├── fish/
│   │   │   └── fish.ts               # new base fish entity + movement
│   │   ├── player/
│   │   │   └── player-controller.ts  # new input/controller
│   │   ├── assets/
│   │   │   └── game-assets.ts        # add fish asset exports
│   │   └── map/
│   │       ├── game-view.ts
│   │       └── utils/
│   │           └── layout-types.ts
│   ├── components/
│   ├── state/
│   └── styles/
└── shared/
	└── types/
		└── vec2.ts                   # shared Vec2 type
```
## Phase 0: Research

Completed in [specs/003-player-movement/research.md](specs/003-player-movement/research.md).

Key decisions:
- Fixed timestep of 0.0167s with accumulator and rAF loop.
- Cap catch-up steps to 5 and clamp frame delta to 0.25s.
- DOM rendering using CSS transforms for smooth movement.
- Input state from keydown/keyup for deterministic steps.

## Phase 1: Design & Contracts

### Data Model
Defined in [specs/003-player-movement/data-model.md](specs/003-player-movement/data-model.md).

### Contracts
No HTTP endpoints introduced in this phase; documented in [specs/001-player-movement/contracts/openapi.yaml](specs/003-player-movement/contracts/openapi.yaml).

### Quickstart
Manual run/verification steps in [specs/003-player-movement/quickstart.md](specs/003-player-movement/quickstart.md).

### Update Agent Context
Run `.specify/scripts/bash/update-agent-context.sh copilot` after Phase 1 artifacts are generated.

## Phase 2: Implementation Plan

1. Add fish asset exports in `feature/assets/game-assets.ts` for available fish SVGs.
2. Introduce shared `shared/vec2.ts` and update movement types to use it.
3. Implement `feature/fish/fish.ts` to hold position/velocity, apply acceleration/drag, enforce 45° vertical limit, and expose facing direction and sprite.
4. Implement `feature/player/player-controller.ts` to track WASD/arrow input and provide deterministic input snapshots.
5. Implement `feature/engine/game-loop.ts` fixed-step engine with accumulator, 0.0167s steps, 5-step cap, and 0.25s frame clamp.
6. Integrate fish rendering into `game-view.ts` using DOM elements with `transform` updates and fish assets.
6. Manual verification using the quickstart checklist.

## Complexity Tracking

No constitutional violations.

