---

description: "Task list for player movement implementation"
---

# Tasks: Player Movement (Client)

**Input**: Design documents from `/specs/001-player-movement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature directories and shared types scaffolding

- [x] T001 Create feature folders in src/client/feature/engine/, src/client/feature/fish/, src/client/feature/player/, and src/client/feature/assets/
- [x] T002 Create shared types folder src/shared/types/ for Vec2 and future shared types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and assets plumbing required for all stories

- [x] T003 Add Vec2 type in src/shared/types/vec2.ts and use it in movement-related code
- [x] T004 Move/duplicate asset exports into src/client/feature/assets/game-assets.ts and update any imports that will consume it
- [x] T005 Update src/client/feature/map/utils/layout-types.ts to import Vec2 from src/shared/types/vec2.ts (no local Vec2 definition)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Move the fish avatar (Priority: P1) 🎯 MVP

**Goal**: Player can move a fish using WASD or arrow keys

**Manual Verification**: Run the client and confirm the fish responds to both WASD and arrow keys; opposing inputs cancel.

### Implementation for User Story 1

- [x] T006 [P] [US1] Export fish asset URLs in src/client/feature/assets/game-assets.ts (pick one default fish sprite)
- [x] T007 [P] [US1] Implement Fish base entity in src/client/feature/fish/fish.ts (position, velocity, facing, wiggle, drag)
- [x] T008 [US1] Implement player input state and controller in src/client/feature/player/player-controller.ts (WASD + arrows, opposing inputs cancel)
- [x] T009 [US1] Render the fish in src/client/feature/map/game-view.ts using DOM elements and transform updates
- [x] T010 [US1] Add fish styling in src/client/styles/game-view.css (positioning, transform origin, optional wiggle)

**Checkpoint**: User Story 1 is functional and manually verifiable

---

## Phase 4: User Story 2 - Consistent movement across device speeds (Priority: P2)

**Goal**: Movement speed is consistent across frame rates via fixed timestep updates

**Manual Verification**: Hold a direction for a fixed time at low and high frame rates and compare distance traveled.

### Implementation for User Story 2

- [x] T011 [P] [US2] Implement fixed-timestep loop in src/client/feature/engine/game-loop.ts (accumulator, 0.0167s step)
- [x] T012 [US2] Integrate game loop with Fish and PlayerController in src/client/feature/map/game-view.ts
- [x] T013 [US2] Ensure movement updates are deterministic per step in src/client/feature/fish/fish.ts

**Checkpoint**: User Story 2 is functional and independently verifiable

---

## Phase 5: User Story 3 - Smooth recovery after lag (Priority: P3)

**Goal**: Lag recovery catches up without runaway updates

**Manual Verification**: Stall rendering briefly (background tab) and verify the fish catches up smoothly without freezing.

### Implementation for User Story 3

- [x] T014 [US3] Add catch-up cap per frame in src/client/feature/engine/game-loop.ts (max steps = 5)
- [x] T015 [US3] Clamp long frame deltas in src/client/feature/engine/game-loop.ts (max frame delta = 0.25s)

**Checkpoint**: User Story 3 is functional and independently verifiable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration checks and documentation alignment

- [x] T016 [P] Update src/client/feature/map/game-view.ts to ensure fish uses provided assets and stays within 45° vertical angle
- [x] T017 [P] Update specs/001-player-movement/quickstart.md with any updated manual verification notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other stories
- **US2 (P2)**: Starts after Foundational; integrates with US1 entities
- **US3 (P3)**: Starts after Foundational; extends US2 loop behavior

### Parallel Opportunities

- T006 and T007 can run in parallel (different files)
- T011 can run in parallel with T007 once Foundational is done
- T014 and T015 can run in parallel once US2 loop exists
- T016 and T017 can run in parallel at the end

---

## Parallel Example: User Story 1

- Task: "Export fish asset URLs in src/client/feature/assets/game-assets.ts"
- Task: "Implement Fish base entity in src/client/feature/fish/fish.ts"

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate manually using quickstart steps

### Incremental Delivery

1. Add US1 and validate
2. Add US2 and validate
3. Add US3 and validate
4. Final polish tasks
