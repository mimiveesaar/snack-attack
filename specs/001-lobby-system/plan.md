# Implementation Plan: Snack Attack Lobby System

**Branch**: `001-lobby-system` | **Date**: 2026-01-17 | **Spec**: [specs/001-lobby-system/spec.md](specs/001-lobby-system/spec.md)
**Input**: Feature specification from `/specs/001-lobby-system/spec.md`

**Note**: Generated via `/speckit.plan` workflow.

## Summary

- Deliver a desktop-first lobby experience in a fixed 500 x 500 container: nickname + fish color entry, create-or-join flow keyed by `/lobby/{id}`.
- Leader-only controls for gamemode (single vs multi, cap 1 or 4), difficulty (Easy/Medium/Hard), share URL, and start game; switching to singleplayer ejects other players.
- Real-time lobby sync (players, leader, counts, settings, active game status) over Socket.IO; duplicate nicknames get numeric suffixes.
- Waiting view for joiners during an active game showing leaderboard + timer and auto-admitting when slots free; DOM/CSS/SVG rendering only, no Canvas.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time), pnpm-managed; prefer DOM/Web APIs
**Storage**: In-memory lobby state (Maps keyed by lobbyId) with periodic cleanup of empty lobbies; no persistent DB
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed 500×500 viewport, centered when space allows
**Rendering**: DOM/CSS/SVG only; HTML Canvas prohibited; fixed-size layout, no responsive scaling
**Project Type**: Single web project with client (Lit) and lightweight Node socket server
**Performance Goals**: Real-time lobby updates visible to all clients within 2s; create/join within 5s; share action feedback within 1s
**Constraints**: Max 4 players per lobby (multiplayer); singleplayer capacity 1; no mobile/responsive design; animations cosmetic only
**Scale/Scope**: Small-scale lobbies (<=4 players) with many concurrent lobbies; short-lived sessions; manual validation only

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

**Gate Status**: All gates satisfied by plan assumptions; no violations expected. Any new dependency or rendering change must be justified against constitution.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── server/            # Node + Socket.IO lobby service (in-memory state, cleanup cron)
├── client/
│   ├── components/    # Lit web components (forms, lobby list, waiting view)
│   ├── state/         # Client state + socket event handlers
│   ├── styles/        # CSS for fixed 500×500 container, palette, outlines
│   ├── assets/        # PNG pixel-art decorative assets
│   └── utils/         # Helpers (validation, formatting, clipboard fallback)
└── shared/            # Types and message contracts for lobby/game events
## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
