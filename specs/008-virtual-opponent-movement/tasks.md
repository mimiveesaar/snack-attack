---
description: "Task list for Virtual Opponent Movement"
---

# Tasks: Virtual Opponent Movement

**Input**: Design documents from `/specs/008-virtual-opponent-movement/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

### Path Conventions

- **Web app**: `src/client/`, `src/server/`, `src/shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared data structures for bot movement

- [x] T001 Add virtual opponent profile and state types to src/server/game/state.ts
- [x] T002 Add optional bot marker to game state update payloads in src/shared/game-events.ts (if needed for debugging/visibility)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bot control pipeline wired into server loop

- [x] T003 Create bot behavior profile config per difficulty in src/server/feature/bot/bot-profiles.ts
- [x] T004 Create bot controller to compute movement inputs in src/server/feature/bot/bot-manager.ts
- [x] T005 Initialize bot roster for singleplayer sessions in src/server/feature/session/session-manager.ts
- [x] T006 Apply bot movement inputs each tick in src/server/game/loop.ts (before playerManager.tick)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Human-Like Opponent Movement (Priority: P1) 🎯 MVP

**Goal**: Virtual opponents move purposefully and compete like players.

**Manual Verification**: Start a singleplayer match with opponents and observe purposeful movement and competition.

### Implementation for User Story 1

- [x] T007 [US1] Implement target selection heuristics (pursue smaller players/NPCs, avoid larger threats) in src/server/feature/bot/bot-manager.ts
- [x] T008 [US1] Integrate bot inputs with existing player movement in src/server/feature/player/player-manager.ts
- [x] T009 [US1] Ensure bots are excluded from menu controls in src/server/game/controller.ts (movement-only inputs)

**Checkpoint**: User Story 1 is fully functional and manually verifiable

---

## Phase 4: User Story 2 - Movement Variety Prevents Stalls (Priority: P2)

**Goal**: Bots vary behavior over time to avoid loops and idle states.

**Manual Verification**: Observe bots for 10 minutes and confirm direction/target changes at least every 20 seconds and no long idle periods.

### Implementation for User Story 2

- [x] T010 [US2] Add decision timers and jitter to bot movement in src/server/feature/bot/bot-manager.ts
- [x] T011 [US2] Add per-bot randomness seed and target switching rules in src/server/feature/bot/bot-manager.ts

**Checkpoint**: User Story 2 is independently verifiable

---

## Phase 5: User Story 3 - Opponents Don’t Control Menus (Priority: P3)

**Goal**: Bots cannot pause, restart, or quit games.

**Manual Verification**: Confirm no bot-triggered pause/restart/quit in a singleplayer match.

### Implementation for User Story 3

- [x] T012 [US3] Guard bot inputs from pause/restart/quit handlers in src/server/game/controller.ts

**Checkpoint**: User Story 3 is independently verifiable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation alignment and manual validation

- [ ] T013 [P] Run manual verification in specs/008-virtual-opponent-movement/quickstart.md
- [ ] T014 [P] Update contract notes if implementation diverges in specs/008-virtual-opponent-movement/contracts/notes.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only
- **US2 (P2)**: Depends on Phase 2 only
- **US3 (P3)**: Depends on Phase 2 only

### Parallel Opportunities

- T003 and T004 can run in parallel
- T013 and T014 can run in parallel
- User stories can be worked in parallel after Phase 2

---

## Parallel Example: User Story 1

- T007 [US1] Implement target selection heuristics in src/server/feature/bot/bot-manager.ts
- T008 [US1] Integrate bot inputs in src/server/feature/player/player-manager.ts

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate manually using the US1 verification steps

### Incremental Delivery

1. Setup + Foundational
2. US1 → Validate
3. US2 → Validate
4. US3 → Validate
5. Polish tasks

---

## Notes

- [P] tasks = different files, no dependencies
- Each user story is independently verifiable via manual steps
- Avoid introducing new dependencies or test infrastructure
