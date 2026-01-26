# Implementation Plan: Virtual Opponent Movement

**Branch**: `008-virtual-opponent-movement` | **Date**: 2026-01-26 | **Spec**: [specs/008-virtual-opponent-movement/spec.md](specs/008-virtual-opponent-movement/spec.md)
**Input**: Feature specification from `/specs/008-virtual-opponent-movement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement server-authoritative virtual opponent movement for singleplayer matches using difficulty-based behavior profiles. Opponents compete with players and each other, avoid repetitive loops, and never interact with game menus. Reuse existing game loop and movement logic without new dependencies.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: In-memory game session state; no new persistence
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server + shared types)
**Performance Goals**: Maintain 60Hz server loop with bots; 20Hz state broadcast remains stable
**Constraints**: No new dependencies; no tests; bots are server-controlled only
**Scale/Scope**: 0–3 virtual opponents per singleplayer match; no multiplayer changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Clarity**: ✅ Prefer explicit bot decision logic per tick/profile.
- **Simple UX**: ✅ No new UI; gameplay-only behavior.
- **Minimal Dependencies**: ✅ No new dependencies required.
- **Simple Over Abstract**: ✅ Avoid heavy AI frameworks; simple heuristics.
- **No Testing**: ✅ No tests added.
- **Technology Stack**: ✅ Node.js, TypeScript (strict), Lit, Socket.IO, pnpm only.
- **Desktop-First Game**: ✅ Fixed viewport; no responsive work planned.
- **Rendering**: ✅ DOM/CSS/SVG only.

## Project Structure

### Documentation (this feature)

```text
specs/008-virtual-opponent-movement/
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
│   ├── game/             # Client game rendering and input
│   └── styles/           # Theme and component styles
├── server/
│   ├── feature/          # Gameplay systems (npc, player, collision)
│   └── game/             # Game loop and state
└── shared/               # Shared types and socket event contracts

```

## Phase 0: Outline & Research

- Review existing server loop and NPC movement patterns for reuse.
- Define behavior profile parameters per difficulty (reaction rate, target switching, risk tolerance).

## Phase 1: Design & Contracts

- Data model for virtual opponent behavior profiles and runtime state.
- Contract notes (no new socket events; bots are server-only).
- Quickstart manual verification steps.

## Constitution Check (Post-Design)

- **Code Clarity**: ✅ Bot logic isolated and readable.
- **Simple UX**: ✅ No UI changes required.
- **Minimal Dependencies**: ✅ No new dependencies introduced.
- **Simple Over Abstract**: ✅ Use simple heuristics instead of complex AI.
- **No Testing**: ✅ No tests planned.
- **Technology Stack**: ✅ Node.js, TypeScript, Lit, Socket.IO, pnpm only.
- **Desktop-First Game**: ✅ Desktop-only, fixed viewport assumptions preserved.
- **Rendering**: ✅ DOM/CSS/SVG only.

## Phase 2: Implementation Planning (deferred)

- Detailed task breakdown will be produced in tasks.md after plan approval.
