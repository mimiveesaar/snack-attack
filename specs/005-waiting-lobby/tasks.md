---

description: "Task list for waiting lobby enhancements"
---

# Tasks: Waiting Lobby Enhancements

**Input**: Design documents from `/specs/005-waiting-lobby/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm integration points and constraints for the feature

- [x] T001 Review current waiting-lobby join/emit flow in src/server/index.ts and src/client/state/lobby-state.ts
- [x] T002 Review active-game timer/leaderboard data sources in src/server/game-session.ts and src/server/game/state.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and payloads required by all user stories

- [x] T003 [P] Extend waiting payload typing (position, full message, snapshot fields) in src/shared/events.ts
- [x] T004 [P] Add ActiveGameSnapshot type (hasActiveGame, timerRemainingMs, leaderboard) in src/shared/game-session.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Immediate Lobby Admission (Priority: P1) 🎯 MVP

**Goal**: Admit waiting players automatically in FIFO order when the game ends and seats open.

**Manual Verification**: Join during an active game, end the game, and confirm waiting players auto-join within 2 seconds in FIFO order.

### Implementation for User Story 1

- [x] T005 [US1] Track FIFO waiting queue and admission helpers in src/server/lobby-store.ts
- [x] T006 [US1] Route joiners to waiting during active games in src/server/index.ts
- [x] T007 [US1] Admit waiting players on game end and emit lobby:state updates in src/server/game-session.ts
- [x] T008 [US1] Clear waiting state and transition to lobby on admission in src/client/state/lobby-state.ts

**Checkpoint**: User Story 1 is functional and manually verifiable

---

## Phase 4: User Story 2 - Waiting Lobby Status Feedback (Priority: P2)

**Goal**: Keep waiting players informed when the lobby is full.

**Manual Verification**: Fill the lobby to 4 players, join during an active game, and confirm the waiting screen shows the exact lobby-full message.

### Implementation for User Story 2

- [x] T009 [US2] Compute lobby-full state and message in waiting snapshots in src/server/lobby-store.ts
- [x] T010 [US2] Include waitingPosition/isLobbyFull/fullMessage in game:waiting emission in src/server/index.ts
- [x] T011 [US2] Render lobby-full message in the waiting UI in src/client/components/waiting-view.ts

**Checkpoint**: User Story 2 is functional and manually verifiable

---

## Phase 5: User Story 3 - Watch Active Game Progress (Priority: P3)

**Goal**: Show the full active-game leaderboard and remaining time on the waiting screen.

**Manual Verification**: While a game is active, join the waiting lobby and confirm the leaderboard and timer update; when no active game exists, the timer shows “No active game.”

### Implementation for User Story 3

- [x] T012 [US3] Build active-game snapshot (leaderboard + timer/idle) for waiting clients in src/server/game-session.ts
- [x] T013 [US3] Emit periodic waiting snapshots (≤2s) during active games in src/server/index.ts
- [x] T014 [US3] Store snapshot state from game:waiting in src/client/state/lobby-state.ts
- [x] T015 [US3] Render full leaderboard and timer/“No active game” state in src/client/components/waiting-view.ts

**Checkpoint**: User Story 3 is functional and manually verifiable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across stories

- [ ] T016 Run manual validation steps in specs/005-waiting-lobby/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories
- **User Story 2 (P2)**: Independent of other stories after Foundation
- **User Story 3 (P3)**: Independent of other stories after Foundation

### Parallel Opportunities

- T003 and T004 can run in parallel (different shared type files)
- After Foundation, US1, US2, and US3 can proceed in parallel if staffed
- Within a story, tasks touching different files can be parallelized carefully

---

## Parallel Example: User Story 1

- Task: “T005 Track FIFO waiting queue and admission helpers in src/server/lobby-store.ts”
- Task: “T006 Route joiners to waiting during active games in src/server/index.ts”

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate manually using quickstart steps relevant to US1

### Incremental Delivery

1. Setup + Foundational
2. User Story 1 → Validate
3. User Story 2 → Validate
4. User Story 3 → Validate
5. Final polish and manual validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Manual validation only (no automated tests)
