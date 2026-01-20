# Implementation Plan: PvP Fish Eating

**Branch**: `004-pvp-fish-eating` | **Date**: 2026-01-20 | **Spec**: [specs/004-pvp-fish-eating/spec.md](specs/004-pvp-fish-eating/spec.md)
**Input**: Feature specification from `/specs/004-pvp-fish-eating/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable player-vs-player eating when the attacker has strictly higher XP, triggering the eaten player’s respawn with XP reset, no XP gain for the eater, and XP labels displayed alongside nicknames. Implementation extends server collision handling and respawn flow, and updates client label rendering using existing SVG nickname labels.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: In-memory Maps on the Node server for lobby/game session state (no persistence)
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server + shared types)  
**Performance Goals**: 60 Hz server tick, 10 Hz state broadcasts, smooth 60 FPS client rendering
**Constraints**: Server-authoritative collisions, fixed desktop viewport, no HTML Canvas, no automated tests
**Scale/Scope**: Multiplayer lobbies up to 4 players

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
- Complete: [specs/004-pvp-fish-eating/research.md](specs/004-pvp-fish-eating/research.md).

### Phase 1: Design & Contracts
- Data model: [specs/004-pvp-fish-eating/data-model.md](specs/004-pvp-fish-eating/data-model.md).
- Contracts: [specs/004-pvp-fish-eating/contracts/game-events.md](specs/004-pvp-fish-eating/contracts/game-events.md).
- Quickstart: [specs/004-pvp-fish-eating/quickstart.md](specs/004-pvp-fish-eating/quickstart.md).

### Phase 2: Implementation Outline
1) **Server: PvP collision checks**
  - Add player-vs-player collision evaluation using current XP and collision radius.
  - Respect grace period and invincibility checks used for NPC-eat.
2) **Server: Respawn + XP rules**
  - Trigger `setPlayerRespawning` for eaten players with existing delay.
  - Ensure eater gains no XP from player-eat events.
  - Update leaderboard after respawn triggers.
3) **Server: Event payloads**
  - Emit `fish-eaten` event data for player-vs-player cases with eater/target IDs.
4) **Client: XP label rendering**
  - Extend player label to include XP alongside nickname.
  - Keep label anchored to fish and updated per state update.
5) **Manual validation**
  - Follow quickstart steps; no automated tests.

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
