---
description: "Task list for Singleplayer Lobby Customization"
---

# Tasks: Singleplayer Lobby Customization

**Input**: Design documents from `/specs/007-customize-singleplayer-lobby/`
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

**Purpose**: Shared type foundation for client/server coordination

- [x] T001 Add `OpponentSlot` and `singleplayerSettings` types to src/shared/lobby.ts and re-export via src/shared/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Socket contracts and state plumbing required by all stories

- [x] T002 Update Socket.IO typings to accept `singleplayerSettings` in lobby update payloads in src/shared/events.ts
- [x] T003 Update client settings payload typing and forwarding for `singleplayerSettings` in src/client/components/app-root.ts and src/client/lobby/lobby-manager.ts
- [x] T004 Persist `singleplayerSettings` in lobby records and emit with lobby state in src/server/feature/lobby/lobby-manager.ts and src/server/feature/lobby/lobby-controller.ts
- [x] T005 Use `singleplayerSettings` to add virtual opponents on session start in src/server/feature/session/session-manager.ts and src/server/game/state.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Singleplayer Opponents (Priority: P1) 🎯 MVP

**Goal**: Allow players to add, remove, and customize up to three virtual opponents (or none).

**Manual Verification**: Open Manage Opponents in singleplayer, edit names/colors, add/remove slots (0–3), and ensure changes apply immediately.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create Manage Opponents overlay component in src/client/components/opponent-overlay.ts
- [x] T007 [P] [US1] Add overlay and opponent-slot styling in src/client/styles/theme.css
- [x] T008 [US1] Add Manage Opponents button and overlay wiring for singleplayer in src/client/components/lobby-controls.ts
- [x] T009 [US1] Wire opponent settings into lobby state updates in src/client/components/lobby-controls.ts and src/client/components/app-root.ts
- [x] T010 [US1] Implement slot defaults (slot 1 auto-added), add/remove behavior, and max-3 enforcement in src/client/components/opponent-overlay.ts

**Checkpoint**: User Story 1 is fully functional and manually verifiable

---

## Phase 4: User Story 2 - Simplified Singleplayer Lobby Controls (Priority: P2)

**Goal**: Provide a single difficulty cycle button and remove share controls in singleplayer.

**Manual Verification**: In singleplayer, confirm share URL is hidden and difficulty cycles easy → medium → hard → easy.

### Implementation for User Story 2

- [x] T011 [US2] Replace singleplayer difficulty buttons with a cycle button in src/client/components/lobby-controls.ts
- [x] T012 [US2] Hide share URL control when gamemode is singleplayer in src/client/components/lobby-controls.ts

**Checkpoint**: User Story 2 is independently verifiable

---

## Phase 5: User Story 3 - Multiplayer Lobby Remains Unchanged (Priority: P3)

**Goal**: Ensure multiplayer layout and behavior stays identical to current behavior.

**Manual Verification**: In multiplayer, confirm share URL and existing difficulty buttons render as before.

### Implementation for User Story 3

- [x] T013 [US3] Guard singleplayer-only branches so multiplayer UI renders unchanged in src/client/components/lobby-controls.ts

**Checkpoint**: User Story 3 is independently verifiable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation alignment and manual validation

- [ ] T014 [P] Run manual verification in specs/007-customize-singleplayer-lobby/quickstart.md
- [ ] T015 [P] Update contract notes if implementation diverges in specs/007-customize-singleplayer-lobby/contracts/socket-events.md

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

- T006 and T007 can run in parallel
- T014 and T015 can run in parallel
- Different user stories can be worked on in parallel after Phase 2

---

## Parallel Example: User Story 1

- T006 [P] [US1] Create Manage Opponents overlay component in src/client/components/opponent-overlay.ts
- T007 [P] [US1] Add overlay and opponent-slot styling in src/client/styles/theme.css

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
