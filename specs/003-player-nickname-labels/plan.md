# Implementation Plan: Player Nickname Labels

**Branch**: `003-player-nickname-labels` | **Date**: 2026-01-20 | **Spec**: [specs/003-player-nickname-labels/spec.md](specs/003-player-nickname-labels/spec.md)
**Input**: Feature specification from `/specs/003-player-nickname-labels/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Render small white nickname labels above each player-controlled fish during gameplay. Labels derive from existing player state and are drawn as SVG text elements aligned to player positions, with truncation for long names and boundary-safe positioning.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: N/A (derived from existing game state)
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server + shared types)
**Performance Goals**: 60 FPS rendering with minimal SVG text updates per tick
**Constraints**: No HTML Canvas; fixed desktop viewport; no automated tests
**Scale/Scope**: Multiplayer sessions up to 4 players

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

**Result**: Pass (no violations expected)

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
├── client/
│   ├── game/
│   │   ├── managers/           # Renderers (player, npc, powerup)
│   │   └── components/         # Game scene + overlays
│   └── state/                  # Lobby/game client state
├── server/
│   └── game/                   # Game loop + collision
└── shared/                     # Shared types

## Implementation Plan

### Phase 0: Research
- Complete: [specs/003-player-nickname-labels/research.md](specs/003-player-nickname-labels/research.md).

### Phase 1: Design & Contracts
- Data model: [specs/003-player-nickname-labels/data-model.md](specs/003-player-nickname-labels/data-model.md).
- Contracts: [specs/003-player-nickname-labels/contracts/notes.md](specs/003-player-nickname-labels/contracts/notes.md).
- Quickstart: [specs/003-player-nickname-labels/quickstart.md](specs/003-player-nickname-labels/quickstart.md).

### Phase 2: Implementation Outline
1) **Player renderer enhancement**
  - Add label rendering using SVG `<text>` elements for each player.
  - Position label above fish and update per state update.
2) **Label styling & truncation**
  - Apply white fill and small font size.
  - Truncate long names to a max length with ellipsis.
3) **Boundary handling**
  - Ensure labels stay visible at top boundary (offset clamp).
4) **Manual validation**
  - Follow quickstart checks; no automated tests.

### Post-Design Constitution Check
- **Code Clarity**: Pass
- **Simple UX**: Pass
- **Minimal Dependencies**: Pass
- **Simple Over Abstract**: Pass
- **No Testing**: Pass
- **Technology Stack**: Pass
- **Desktop-First Game**: Pass
- **Rendering**: Pass

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
