# Implementation Plan: Waiting Lobby Enhancements

**Branch**: `005-waiting-lobby` | **Date**: 2026-01-20 | **Spec**: [specs/005-waiting-lobby/spec.md](specs/005-waiting-lobby/spec.md)
**Input**: Feature specification from `/specs/005-waiting-lobby/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Hold all joiners in a waiting lobby during active games, auto-admit them in FIFO order when games end and seats open, and show the full active-game leaderboard and timer on the waiting screen (or “No active game” when idle). Implementation updates server waiting-queue admission logic and emits a single waiting-state snapshot to clients at ≤2s latency, while the client renders lobby-full messaging and active-game status in the waiting view.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js (current LTS)
**Primary Dependencies**: Lit (web components), Socket.IO (real-time communication) + minimal justified additions
**Storage**: In-memory Maps on the Node server for lobby/game session state (no persistence)
**Testing**: None (constitutional prohibition—no test frameworks or test files)
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge) with fixed viewport
**Rendering**: DOM/CSS/SVG only (HTML Canvas prohibited by constitution)
**Project Type**: Web application (client + server + shared types)
**Performance Goals**: Waiting-state updates visible within ≤2 seconds; align with existing 60 Hz server tick and 10 Hz state broadcasts where applicable
**Constraints**: Server-authoritative lobby admissions, fixed desktop viewport, no HTML Canvas, no automated tests
**Scale/Scope**: Multiplayer lobbies up to 4 players, FIFO waiting queue

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
specs/005-waiting-lobby/
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
│   ├── components/
│   │   ├── waiting-view.ts     # Waiting screen UI
│   │   ├── lobby-entry.ts      # Join flow
│   │   └── player-list.ts      # Lobby roster + waiting state
│   └── state/
│       └── lobby-state.ts      # Client lobby/waiting state handling
├── server/
│   ├── lobby-store.ts          # Lobby state + waiting queue
│   ├── game-session.ts         # Game lifecycle (end triggers admission)
│   └── index.ts                # Socket.IO namespaces/events
└── shared/
    ├── lobby.ts                # Lobby types
    └── game-session.ts         # Game session types

## Implementation Plan

### Phase 0: Research
- Complete: [specs/005-waiting-lobby/research.md](specs/005-waiting-lobby/research.md).

### Phase 1: Design & Contracts
- Data model: [specs/005-waiting-lobby/data-model.md](specs/005-waiting-lobby/data-model.md).
- Contracts: [specs/005-waiting-lobby/contracts/socket-events.md](specs/005-waiting-lobby/contracts/socket-events.md).
- Quickstart: [specs/005-waiting-lobby/quickstart.md](specs/005-waiting-lobby/quickstart.md).

### Phase 2: Implementation Outline
1) **Server: waiting lobby admission rules**
  - Force new joiners into waiting state while a game is active, regardless of open slots.
  - Maintain FIFO queue for waiting players per lobby.
2) **Server: post-game admission**
  - On game end, admit waiting players into open slots in order.
  - Emit updated lobby roster to admitted players and existing lobby clients.
3) **Server: waiting-state snapshots**
  - Emit a single waiting-state snapshot (leaderboard + timer/idle state) to waiting clients at ≤2s cadence.
4) **Client: waiting view rendering**
  - Show full active-game leaderboard, timer, and “No active game” fallback.
  - Display lobby-full message exactly: “Lobby full (4/4). Waiting for a slot.”
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
