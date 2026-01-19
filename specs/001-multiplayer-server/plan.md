# Implementation Plan: Multiplayer Server v1

**Branch**: 001-multiplayer-server | **Date**: 19 January 2026 | **Spec**: [specs/001-multiplayer-server/spec.md](specs/001-multiplayer-server/spec.md)
**Input**: Feature specification from [specs/001-multiplayer-server/spec.md](specs/001-multiplayer-server/spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the first server-side multiplayer session flow using Socket.IO: create and manage active game sessions on lobby start, associate player ids with live sockets via a ready packet, run a fixed 60 TPS simulation loop, and broadcast per-tick hostile snapshots (entity id, position x/y, velocity) to all session players. Add game-session store/orchestrator modules and update lobby controller orchestration and shared Socket.IO event contracts to broadcast disconnects and end sessions when the last player leaves.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: In-memory server state (game sessions, player connections) only
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application with shared types (src/client, src/server, src/shared)
**Performance Goals**: 60 TPS fixed timestep simulation; first snapshot within 2 seconds of lobby start in 95% of attempts
**Constraints**: No automated tests; single process in-memory session management; per-tick snapshot broadcast at 60 Hz
**Scale/Scope**: Small lobbies (max 4 multiplayer / 1 singleplayer), single-server runtime

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: Yes — explicit game store/orchestrator and per-tick loop functions
- **Simple UX**: Yes — lobby-driven flow with minimal event surface
- **Minimal Dependencies**: Yes — no new dependencies required
- **Simple Over Abstract**: Yes — direct in-memory store and loop
- **No Testing**: Yes — no test infrastructure planned
- **Technology Stack**: Yes — Node.js, TypeScript, Socket.IO, pnpm only
- **Desktop-First Game**: Yes — no mobile/responsive requirements introduced
- **Rendering**: Yes — server-only change, no Canvas usage

## Constitution Check (Post-Design)

- **Code Clarity**: Pass
- **Simple UX**: Pass
- **Minimal Dependencies**: Pass
- **Simple Over Abstract**: Pass
- **No Testing**: Pass
- **Technology Stack**: Pass
- **Desktop-First Game**: Pass
- **Rendering**: Pass

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
│   ├── feature/
│   └── components/
├── server/
│   ├── index.ts
│   ├── feature/
│   │   ├── lobby/
│   │   └── game/           # New server multiplayer modules
│   └── game-session.ts     # New session manager entry
└── shared/
  ├── types/
  └── utils/
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
