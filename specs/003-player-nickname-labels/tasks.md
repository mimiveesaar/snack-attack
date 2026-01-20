# Tasks: Player Nickname Labels

**Input**: Design documents from `/specs/003-player-nickname-labels/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Review existing player state payload for `nicknameDisplay` in src/client/game/game-manager.ts and src/shared/game.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T002 Add label storage and cleanup scaffolding in src/client/game/managers/player-renderer.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Identify players during gameplay (Priority: P1) 🎯 MVP

**Goal**: Display a nickname label above each player-controlled fish and keep it synced with position.

**Manual Verification**: Start a game with multiple players and confirm each fish shows the correct nickname above it throughout gameplay.

### Implementation

- [ ] T003 [US1] Create/update SVG `<text>` labels per player in src/client/game/managers/player-renderer.ts
- [ ] T004 [P] [US1] Ensure `nicknameDisplay` is mapped into `PlayerRenderState` in src/client/game/game-manager.ts
- [ ] T005 [US1] Remove label elements on player removal and renderer clear in src/client/game/managers/player-renderer.ts

**Checkpoint**: User Story 1 functional and manually verifiable

---

## Phase 4: User Story 2 - Readable labels (Priority: P2)

**Goal**: Ensure labels are small, white, and readable without overpowering visuals.

**Manual Verification**: Observe labels during gameplay and confirm white color, small size, and proper placement.

### Implementation

- [ ] T006 [US2] Apply label styling (white fill, small font size, centered text) in src/client/game/managers/player-renderer.ts
- [ ] T007 [US2] Implement nickname truncation with ellipsis in src/client/game/managers/player-renderer.ts
- [ ] T008 [US2] Clamp label Y-position to keep text visible near top boundary in src/client/game/managers/player-renderer.ts

**Checkpoint**: User Stories 1 and 2 both independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T009 [P] Run manual validation steps from specs/003-player-nickname-labels/quickstart.md
- [ ] T010 [P] Update specs/003-player-nickname-labels/quickstart.md if validation reveals needed clarifications

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion
- **Polish (Phase 5)**: Depends on User Stories 1–2 completion

### User Story Dependencies

- **US1**: Requires foundational label scaffolding (T002)
- **US2**: Requires US1 label rendering in place

### Parallel Opportunities

- T003 and T004 can proceed in parallel (different files)
- T009 and T010 can proceed in parallel after implementation complete

---

## Parallel Example: User Story 1

- Task: "Create/update SVG `<text>` labels per player in src/client/game/managers/player-renderer.ts"
- Task: "Ensure `nicknameDisplay` is mapped into `PlayerRenderState` in src/client/game/game-manager.ts"

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Manual verification for US1

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver US1 (MVP)
3. Deliver US2 for readability improvements
4. Validate using quickstart manual steps

### Parallel Team Strategy

- Developer A: Player renderer label creation and removal tasks (T003, T005)
- Developer B: `nicknameDisplay` mapping (T004)
- Developer C: Readability tasks (T006–T008)
