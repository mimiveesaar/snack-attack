---

description: "Tasks for Snack Attack Lobby System"
---

# Tasks: Snack Attack Lobby System

**Input**: Design documents from `/specs/001-lobby-system/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Constitutional Note**: No automated tests. Manual validation only. Stack is Node.js + TypeScript (strict) + Lit + Socket.IO; HTML Canvas prohibited; fixed 500×500 desktop viewport.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create project structure per plan in [src/](src/) with server/, client/, shared/
- [x] T002 Initialize pnpm project with Node + TypeScript strict config and dependencies (Lit, Socket.IO client/server) in [package.json](package.json)
- [x] T003 Configure TypeScript strict compiler options and path aliases for server/client/shared in [tsconfig.json](tsconfig.json)
- [x] T004 Establish base npm scripts for dev (socket server + client) and build in [package.json](package.json)

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Define shared types for Lobby, Player, GameSession, events in [shared/types.ts](shared/types.ts)
- [x] T006 Implement palette tokens and fixed 500×500 container styles in [src/client/styles/theme.css](src/client/styles/theme.css)
- [x] T007 [P] Add utility helpers for validation (nickname rules) and clipboard fallback in [src/client/utils/validation.ts](src/client/utils/validation.ts) and [src/client/utils/clipboard.ts](src/client/utils/clipboard.ts)
- [x] T008 Implement in-memory lobby store (Maps keyed by lobbyId) with cleanup of empty lobbies in [src/server/lobby-store.ts](src/server/lobby-store.ts)
- [x] T009 Wire Socket.IO server bootstrap with namespace `/lobby` and heartbeat broadcasting in [src/server/index.ts](src/server/index.ts)

## Phase 3: User Story 1 - Join or Create Lobby (Priority: P1) 🎯 MVP

**Goal**: Players enter nickname + color, create or join lobby via URL, with duplicate nickname suffixing.
**Manual Verification**: Load root vs `/lobby/{id}`; submit nicknames (valid/invalid); observe deduped entries and leader assignment.

### Implementation
- [x] T010 [P] [US1] Parse URL for lobby id and route create vs join flow in [src/client/state/router.ts](src/client/state/router.ts)
- [x] T011 [P] [US1] Enforce nickname validation and dedupe suffixing on server joins/creates in [src/server/lobby-store.ts](src/server/lobby-store.ts)
- [x] T012 [US1] Implement socket handlers `lobby:create` and `lobby:join` returning lobby state snapshots in [src/server/index.ts](src/server/index.ts)
- [x] T013 [US1] Build nickname + color entry form component with dynamic button label (Create/Join) in [src/client/components/lobby-entry.ts](src/client/components/lobby-entry.ts)
- [x] T014 [US1] Implement client socket connection + state reducer to render lobby roster (with colors and leader badge) in [src/client/state/lobby-state.ts](src/client/state/lobby-state.ts)
- [x] T015 [US1] Render lobby container shell at fixed 500×500 with initial view layout in [src/client/components/app-root.ts](src/client/components/app-root.ts)

## Phase 4: User Story 2 - Manage Lobby Settings (Priority: P2)

**Goal**: Leader manages gamemode/difficulty, copies share URL, starts game; switching to singleplayer ejects others; player count indicator.
**Manual Verification**: Toggle modes/difficulty, see roster update and kicks on singleplayer; copy share URL; start button leader-only.

### Implementation
- [x] T016 [US2] Implement leader-only settings handler `lobby:updateSettings` enforcing capacity and kicking non-leader on singleplayer in [src/server/index.ts](src/server/index.ts)
- [x] T017 [US2] Add leader-only controls UI (gamemode toggle, difficulty buttons, start game button) in [src/client/components/lobby-controls.ts](src/client/components/lobby-controls.ts)
- [x] T018 [P] [US2] Implement share URL copy action with feedback in [src/client/components/share-url.ts](src/client/components/share-url.ts)
- [x] T019 [US2] Display player list with leader indicator, color swatches, and player count indicator in [src/client/components/player-list.ts](src/client/components/player-list.ts)
- [x] T020 [US2] Emit and handle start game action `lobby:start` (visibility leader-only) in [src/client/components/lobby-controls.ts](src/client/components/lobby-controls.ts)
- [x] T021 [US2] Broadcast lobby state changes (players, leader, gamemode, difficulty, counts) to all clients in [src/server/index.ts](src/server/index.ts)

## Phase 5: User Story 3 - Active Game Joiner Experience (Priority: P3)

**Goal**: Joiners during active game see waiting view (leaderboard + timer) and auto-join next game if capacity allows.
**Manual Verification**: Join during active game, see waiting view; after game ends and a slot is free, user is admitted without refresh.

### Implementation
- [x] T022 [US3] Track game session state (status, timerRemainingMs, leaderboard, seatsAvailable) and emit `game:waiting`/`game:ended` in [src/server/game-session.ts](src/server/game-session.ts)
- [x] T023 [US3] Handle queued joiners during active game and auto-admit on game end with roster update in [src/server/index.ts](src/server/index.ts)
- [x] T024 [US3] Implement waiting view component showing leaderboard + timer with locked inputs in [src/client/components/waiting-view.ts](src/client/components/waiting-view.ts)
- [x] T025 [US3] Integrate client state transitions between waiting and lobby views based on socket events in [src/client/state/lobby-state.ts](src/client/state/lobby-state.ts)

## Final Phase: Polish & Cross-Cutting

- [x] T026 [P] Add CSS outlines/shadows and highlight states per palette for buttons, leader badges, and containers in [src/client/styles/theme.css](src/client/styles/theme.css)
- [x] T027 Harden clipboard fallback messaging and error toasts in [src/client/utils/clipboard.ts](src/client/utils/clipboard.ts)
- [x] T028 Document manual validation steps and flows in [specs/001-lobby-system/quickstart.md](specs/001-lobby-system/quickstart.md)

## Dependencies (Story Order)
- US1 (Join/Create) → US2 (Manage Settings) → US3 (Active Game Joiner)

## Parallel Execution Examples
- Parallelize T007 (validation/clipboard utils) with T008 (lobby store) and T009 (socket bootstrap).
- In US1, run T010 (URL parse) and T011 (dedupe logic) in parallel before wiring handlers T012.
- In US2, run T018 (share URL UI) in parallel with T019 (player list) while T016 progresses.
- In US3, run T022 (session tracking) in parallel with T024 (waiting view UI) before integrating T025.

## Implementation Strategy
- Ship MVP after US1 completion (create/join, roster display, leader assignment).
- Layer US2 controls once roster/state sync is stable; validate kicks and counts.
- Add US3 waiting/auto-admit last to avoid blocking earlier delivery.
