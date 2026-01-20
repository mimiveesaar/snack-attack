---
description: "Task list for PvP Fish Eating"
---

# Tasks: PvP Fish Eating

**Input**: Design documents from /specs/004-pvp-fish-eating/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Review respawn delay/grace constants in src/server/game/state.ts for reuse in PvP eating

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T002 [P] Update collision event payload typing for player-eat fields in src/shared/game-events.ts

---

## Phase 3: User Story 1 - Eat Smaller Players (Priority: P1) 🎯 MVP

**Goal**: Higher-XP players can eat lower-XP players, triggering respawn with XP reset, no XP gain to the eater, and NPC-eat timing/invulnerability rules.

**Manual Verification**: Follow the PvP respawn and XP checks in specs/004-pvp-fish-eating/quickstart.md

### Implementation

- [ ] T003 [US1] Add player-vs-player collision handling with XP comparison and grace/invincibility checks in src/server/game/collision.ts
- [ ] T004 [US1] Emit player-eat fish-eaten event data (eatenPlayerId, eatenByPlayerId, playerLostXp) in src/server/game/collision.ts
- [ ] T005 [US1] Include player-vs-player collision events in the server tick pipeline in src/server/game/loop.ts

**Checkpoint**: PvP collisions trigger respawn with XP reset and no XP gain for the eater.

---

## Phase 4: User Story 2 - See XP Above Opponents (Priority: P2)

**Goal**: Players see each fish’s current XP next to the nickname above the fish.

**Manual Verification**: Follow the XP label checks in specs/004-pvp-fish-eating/quickstart.md

### Implementation

- [ ] T006 [P] [US2] Format nickname labels to include XP in src/client/game/managers/player-renderer.ts
- [ ] T007 [P] [US2] Adjust label sizing/positioning for nickname+XP text in src/client/game/entities/fish.ts

**Checkpoint**: XP labels update with player XP changes and remain anchored to fish.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T008 [P] Run manual validation steps in specs/004-pvp-fish-eating/quickstart.md and record any issues in specs/004-pvp-fish-eating/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **Polish (Phase 5)**: Depends on completion of desired user stories

### User Story Dependencies
- **US1 (P1)**: No dependencies on other stories
- **US2 (P2)**: Can start after Foundational; independent of US1

### Parallel Opportunities
- **Phase 2**: T002 can run in parallel with other non-overlapping prep work
- **US2**: T006 and T007 can run in parallel
- **Polish**: T008 can run in parallel after implementation is complete

---

## Parallel Execution Examples

### User Story 1
- Task: T003 in src/server/game/collision.ts
- Task: T005 in src/server/game/loop.ts

### User Story 2
- Task: T006 in src/client/game/managers/player-renderer.ts
- Task: T007 in src/client/game/entities/fish.ts

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate with quickstart steps for PvP respawn/XP

### Incremental Delivery
1. Setup + Foundational
2. US1 → Validate
3. US2 → Validate
4. Polish validation
