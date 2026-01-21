---
description: "Task list for fish-eat crunch sound"
---

# Tasks: Fish Eat Crunch Sound

**Input**: Design documents from `/specs/006-fish-eat-sfx/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Constitutional Note**: This project prohibits all testing. Task lists contain implementation and validation steps only—no test files, test frameworks, or test infrastructure tasks are permitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

### Path Conventions

- **Web app**: `src/` at repository root (client + server)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Add crunch asset URL constant in src/client/utils/sound-manager.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 Implement crunch audio buffer loading (fetch + decode) in src/client/utils/sound-manager.ts
- [x] T003 Implement crunch playback state (active sources for overlapping playback) in src/client/utils/sound-manager.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Hear crunch on fish eat (Priority: P1) 🎯 MVP

**Goal**: Play the crunch sound once per fish-eaten event during active gameplay.

**Manual Verification**: Start a match with sound enabled and trigger fish-eaten events; confirm a crunch sound plays per event.

### Implementation for User Story 1

- [x] T004 [US1] Add `playCrunchSound()` that uses the loaded buffer and routes through master gain in src/client/utils/sound-manager.ts
- [x] T005 [US1] Update `playEatSound()` to call `playCrunchSound()` in src/client/utils/sound-manager.ts
- [x] T006 [P] [US1] Remove crunch-specific logging around fish-eaten events in src/client/game/game-manager.ts

**Checkpoint**: User Story 1 is fully functional and manually verifiable

---

## Phase 4: User Story 2 - Respect sound mute (Priority: P2)

**Goal**: Ensure crunch sound does not play when sound is disabled.

**Manual Verification**: Disable sound, trigger fish-eaten events, and confirm no crunch sound plays.

### Implementation for User Story 2

- [x] T007 [US2] Guard `playCrunchSound()` with `soundEnabled`/`masterGain` checks to respect mute in src/client/utils/sound-manager.ts

**Checkpoint**: User Stories 1 and 2 work independently with sound settings respected

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T008 [P] Update sound system documentation with crunch sound details in SOUND_SYSTEM.md
- [ ] T009 [P] Run manual verification steps and update any clarifications in specs/006-fish-eat-sfx/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after User Story 1 (P1)

### Parallel Opportunities

- T006 can run in parallel with T004–T005 (different files)
- T008 and T009 can run in parallel (different files)

---

## Parallel Example: User Story 1

Task: "Remove crunch-specific logging around fish-eaten events in src/client/game/game-manager.ts"
Task: "Add `playCrunchSound()` that uses the loaded buffer and routes through master gain in src/client/utils/sound-manager.ts"

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Manual verification for User Story 1

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Manual verification → MVP ready
3. Add User Story 2 → Manual verification → Feature complete
4. Polish phase → Documentation and quickstart updates

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
