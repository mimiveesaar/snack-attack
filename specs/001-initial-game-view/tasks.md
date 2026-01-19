---
description: "Task list for Initial Game View (Background & Atmosphere)"
---

# Tasks: Initial Game View (Background & Atmosphere)

**Input**: Design documents from `/specs/001-initial-game-view/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature scaffolding and route entry point for the /game view

- [x] T001 Create base game view styles in src/client/styles/game-view.css (fixed viewport, background container)
- [x] T002 [P] Create GameView component shell in src/client/components/game-view.ts (Lit component with root container)
- [x] T003 [P] Register /game route in src/client/state/router.ts and render it in src/client/components/app-root.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities required by all user stories

- [x] T004 [P] Create asset registry for terrain/ambient sprites in src/client/utils/game-assets.ts
- [x] T005 [P] Implement seed normalization and default seed logic in src/client/utils/seed.ts
- [x] T006 [P] Implement deterministic 32-bit PRNG in src/client/utils/prng.ts
- [x] T007 Create layout types and generator in src/client/utils/layout-types.ts and src/client/utils/layout-generator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Enter game view with atmosphere (Priority: P1) 🎯 MVP

**Goal**: Render the /game view with dirt/sand terrain and ambient elements (rocks, seaweed, bubbles), no players

**Manual Verification**: Navigate to /game and confirm terrain + ambient elements render, with no player characters

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement TerrainLayer component in src/client/components/terrain-layer.ts using dirt/sand assets
- [x] T009 [P] [US1] Implement Rock component in src/client/components/rock.ts with size multiplier support
- [x] T010 [P] [US1] Implement Seaweed component in src/client/components/seaweed.ts with size multiplier support
- [x] T011 [P] [US1] Implement Bubble component in src/client/components/bubble.ts (static render only)
- [x] T012 [US1] Compose GameView to render terrain and ambient elements from layout generator in src/client/components/game-view.ts
- [x] T013 [US1] Apply layout positioning styles in src/client/styles/game-view.css

**Checkpoint**: User Story 1 fully functional and manually verifiable

---

## Phase 4: User Story 2 - Consistent map with shared seed (Priority: P2)

**Goal**: Use the /game?seed= query param to deterministically generate identical layouts across clients

**Manual Verification**: Open /game?seed=reef-001 on two clients and compare the layout

### Implementation for User Story 2

- [x] T014 [US2] Parse seed from URL query in src/client/state/router.ts (or helper in src/client/state/route-params.ts)
- [x] T015 [US2] Pass seed into GameView and regenerate layout deterministically in src/client/components/game-view.ts
- [x] T016 [US2] Enforce seed fallback behavior in src/client/utils/seed.ts and ensure missing/invalid seeds use default

**Checkpoint**: User Story 2 independently verifiable with consistent layouts

---

## Phase 5: User Story 3 - Subtle ambient motion (Priority: P3)

**Goal**: Animate bubbles rising from the ground to create an ambient underwater feel

**Manual Verification**: Observe bubbles for 30 seconds and confirm upward motion is continuous

### Implementation for User Story 3

- [x] T017 [US3] Add bubble rise keyframes/animation in src/client/styles/game-view.css (transform/opacity only)
- [x] T018 [US3] Apply seeded animation timing via CSS variables or inline styles in src/client/components/bubble.ts
- [x] T019 [US3] Extend bubble layout fields (duration/delay/start/end offsets) in src/client/utils/layout-generator.ts

**Checkpoint**: User Story 3 independently verifiable with animated bubbles

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanups and documentation alignment

- [x] T020 [P] Document any new layout constants in src/client/utils/layout-generator.ts with inline comments
- [x] T021 [P] Validate quickstart steps remain accurate in specs/001-initial-game-view/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2)

### Within Each User Story

- Models/types before components
- Components before integration in GameView
- Layout generation before rendering

---

## Parallel Opportunities

- Phase 1 tasks T002 and T003 can run in parallel
- Phase 2 tasks T004, T005, T006 can run in parallel
- Phase 3 tasks T008–T011 can run in parallel
- Phase 6 tasks T020–T021 can run in parallel

---

## Parallel Example: User Story 1

- T008 [US1] Implement TerrainLayer component in src/client/components/terrain-layer.ts
- T009 [US1] Implement Rock component in src/client/components/rock.ts
- T010 [US1] Implement Seaweed component in src/client/components/seaweed.ts
- T011 [US1] Implement Bubble component in src/client/components/bubble.ts

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **Stop and validate** with manual verification

### Incremental Delivery

1. Setup + Foundational
2. User Story 1 → validate
3. User Story 2 → validate
4. User Story 3 → validate
5. Polish & cross-cutting updates

---

## Notes

- [P] tasks are safe to run in parallel (different files, no dependencies)
- No testing tasks allowed per constitution
- Each user story should be independently verifiable via manual checks
