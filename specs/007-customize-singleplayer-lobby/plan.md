# Implementation Plan: Singleplayer Lobby Customization

**Branch**: `007-customize-singleplayer-lobby` | **Date**: 2026-01-26 | **Spec**: [specs/007-customize-singleplayer-lobby/spec.md](specs/007-customize-singleplayer-lobby/spec.md)
**Input**: Feature specification from `/specs/007-customize-singleplayer-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Customize the singleplayer lobby UI to remove the share URL control, replace difficulty buttons with a cycling control, and add a Manage Opponents overlay that configures up to three virtual opponents. Preserve all multiplayer lobby behavior. Implement using existing Lit components, lobby state updates, and Socket.IO events, with no new dependencies.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: In-memory lobby state on server; client-side component state (no new persistence)
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server + shared types)  
**Performance Goals**: UI feedback within 100ms for local interactions; lobby updates feel instantaneous
**Constraints**: No new dependencies; no tests; desktop-first fixed viewport only
**Scale/Scope**: Singleplayer opponents limited to 0–3 (player + 0–3 opponents). Multiplayer unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: ✅ Use straightforward state updates and explicit UI logic in Lit components.
- **Simple UX**: ✅ Singleplayer controls are simplified; overlay includes only essential fields.
- **Minimal Dependencies**: ✅ No new dependencies required.
- **Simple Over Abstract**: ✅ Avoid new abstraction layers; reuse existing lobby patterns.
- **No Testing**: ✅ No tests added.
- **Technology Stack**: ✅ Node.js, TypeScript (strict), Lit, Socket.IO, pnpm only.
- **Desktop-First Game**: ✅ Fixed viewport; no responsive work planned.
- **Rendering**: ✅ DOM/CSS/SVG only.

## Project Structure

### Documentation (this feature)

```text
specs/007-customize-singleplayer-lobby/
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
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── components/    # Lit web components
├── services/      # Business logic
├── models/        # Data models
└── utils/         # Utilities (prefer standard library)

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/
└── src/
    ├── models/
    ├── services/
    └── api/

# Implementation Plan: Singleplayer Lobby Customization

**Branch**: `007-customize-singleplayer-lobby` | **Date**: 2026-01-26 | **Spec**: [specs/007-customize-singleplayer-lobby/spec.md](specs/007-customize-singleplayer-lobby/spec.md)
**Input**: Feature specification from `/specs/007-customize-singleplayer-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Customize the singleplayer lobby UI to remove the share URL control, replace difficulty buttons with a cycling control, and add a Manage Opponents overlay that configures up to three virtual opponents. Preserve all multiplayer lobby behavior. Implement using existing Lit components, lobby state updates, and Socket.IO events, with no new dependencies.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: In-memory lobby state on server; client-side component state (no new persistence)
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server + shared types)  
**Performance Goals**: UI feedback within 100ms for local interactions; lobby updates feel instantaneous
**Constraints**: No new dependencies; no tests; desktop-first fixed viewport only
**Scale/Scope**: Singleplayer opponents limited to 0–3 (player + 0–3 opponents). Multiplayer unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: ✅ Use straightforward state updates and explicit UI logic in Lit components.
- **Simple UX**: ✅ Singleplayer controls are simplified; overlay includes only essential fields.
- **Minimal Dependencies**: ✅ No new dependencies required.
- **Simple Over Abstract**: ✅ Avoid new abstraction layers; reuse existing lobby patterns.
- **No Testing**: ✅ No tests added.
- **Technology Stack**: ✅ Node.js, TypeScript (strict), Lit, Socket.IO, pnpm only.
- **Desktop-First Game**: ✅ Fixed viewport; no responsive work planned.
- **Rendering**: ✅ DOM/CSS/SVG only.

## Project Structure

### Documentation (this feature)

```text
specs/007-customize-singleplayer-lobby/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── client/
│   ├── components/       # Lit web components
│   ├── lobby/            # Lobby client logic
│   └── styles/           # Theme and component styles
├── server/
│   ├── feature/
│   └── game/
└── shared/               # Shared types and socket event contracts
```

## Phase 0: Outline & Research

- Confirm existing Socket.IO lobby events and plan payload extensions for singleplayer opponents.
- Decide on UI approach for overlay using existing Lit components and CSS-only layout.

## Phase 1: Design & Contracts

- Data model for opponent slots and singleplayer lobby settings.
- Socket event contract updates for lobby settings/state and start payload.
- Quickstart manual verification steps.

## Constitution Check (Post-Design)

- **Code Clarity**: ✅ Data model and contracts are explicit and minimal.
- **Simple UX**: ✅ Overlay keeps only name, color, add/remove actions.
- **Minimal Dependencies**: ✅ No new dependencies introduced.
- **Simple Over Abstract**: ✅ No new abstraction layers added.
- **No Testing**: ✅ No tests planned.
- **Technology Stack**: ✅ Node.js, TypeScript, Lit, Socket.IO, pnpm only.
- **Desktop-First Game**: ✅ Desktop-only, fixed viewport assumptions preserved.
- **Rendering**: ✅ DOM/CSS/SVG only.

## Phase 2: Implementation Planning (deferred)

- Detailed task breakdown will be produced in tasks.md after plan approval.
