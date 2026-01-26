# Feature Specification: Singleplayer Lobby Customization

**Feature Branch**: `007-customize-singleplayer-lobby`  
**Created**: 2026-01-26  
**Status**: Draft  
**Input**: User description: "Let's customize the lobby entry for the single player mode. For the multiplayer i want everything to remain as is. For singleplayer i want to remove the share URL button. Under the difficulty column where there are currently 3 diffculty levels, i want two buttons instead: one that would cycle through the difficulty levels as clicked. And the other Manage Opponents should open an overlay popup that would allow to select up to three opponents and change their colour (red, blue, green, orange) and name. There should be a small square displayed in the popup for each fish, the first one should be automatically added, but all of the squares should be individuallty closeable so you can also play alone, without any vitual opponents."

## Clarifications

### Session 2026-01-26

- Q: Should opponent overlay changes apply immediately or require a save/apply step? → A: Apply immediately on change (no save button).

## User Scenarios & Validation *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY VERIFIABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Verified independently through manual validation
  - Deployed independently
  - Demonstrated to users independently
  
  NOTE: This project prohibits automated testing. Validation scenarios describe manual verification steps.
-->

### User Story 1 - Configure Singleplayer Opponents (Priority: P1)

As a player setting up a singleplayer game, I want to add, remove, and customize virtual opponents so I can play with the right level of challenge or play alone.

**Why this priority**: This is the core new capability and the main value requested for singleplayer setup.

**Manual Verification**: Open the singleplayer lobby, use Manage Opponents to add/remove opponents, change colors and names, then start a game and confirm the selected opponents are used.

**Acceptance Scenarios**:

1. **Given** a singleplayer lobby, **When** I open Manage Opponents, **Then** I see at least one opponent slot with a color and name ready to edit.
2. **Given** the Manage Opponents view, **When** I remove all opponent slots, **Then** I can proceed with zero opponents.
3. **Given** the Manage Opponents view, **When** I add opponents up to the maximum, **Then** I cannot add more than three total.

---

### User Story 2 - Simplified Singleplayer Lobby Controls (Priority: P2)

As a singleplayer user, I want a simplified lobby layout where difficulty is cycled with one control and sharing controls are removed so the setup is quick and focused.

**Why this priority**: This reduces friction in singleplayer setup and meets the requested layout change.

**Manual Verification**: Enter a singleplayer lobby, confirm the share control is missing, and click the difficulty control to cycle through all levels.

**Acceptance Scenarios**:

1. **Given** a singleplayer lobby, **When** I look at the lobby controls, **Then** there is no share URL control.
2. **Given** a singleplayer lobby, **When** I click the difficulty control repeatedly, **Then** the difficulty cycles through easy, medium, and hard in order and loops back to easy.

---

### User Story 3 - Multiplayer Lobby Remains Unchanged (Priority: P3)

As a multiplayer user, I want the existing lobby controls to remain exactly the same so current workflows are not disrupted.

**Why this priority**: Prevents regressions in the established multiplayer flow.

**Manual Verification**: Enter a multiplayer lobby and confirm all existing controls and behaviors match current expectations.

**Acceptance Scenarios**:

1. **Given** a multiplayer lobby, **When** I view the lobby controls, **Then** the share URL control and existing difficulty controls are present and behave as they do today.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Removing all opponent slots and starting a singleplayer game with zero opponents.
- Attempting to add a fourth opponent slot when three already exist.
- Cycling difficulty past the last option and ensuring it wraps to the first.
- Leaving an opponent name blank and confirming a default name is used.
- Selecting the same color for multiple opponents and confirming it is allowed.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The singleplayer lobby MUST hide the share URL control.
- **FR-002**: The multiplayer lobby MUST remain unchanged, including the share URL control and the current difficulty controls.
- **FR-003**: The singleplayer lobby MUST provide a single difficulty control that cycles through easy, medium, and hard in order and loops back to easy.
- **FR-004**: The singleplayer lobby MUST provide a Manage Opponents control that opens a dedicated overlay for opponent setup.
- **FR-005**: The opponent setup overlay MUST show opponent slots and allow up to three total opponents.
- **FR-006**: The first opponent slot MUST be present by default when the overlay opens.
- **FR-007**: Each opponent slot MUST allow editing the opponent name and choosing a color from red, blue, green, or orange.
- **FR-008**: Users MUST be able to remove any opponent slot, including the first, allowing zero opponents.
- **FR-009**: New opponent slots MUST use default names (Opponent 1, Opponent 2, Opponent 3) when created and whenever a name is left blank.
- **FR-010**: Opponent selections MUST persist while the user remains in the lobby and be used when the singleplayer game starts.

### Key Entities *(include if feature involves data)*

- **Opponent Slot**: Represents a configurable virtual opponent with name, color, and enabled/removed state.
- **Singleplayer Lobby Settings**: Represents the selected difficulty and the list of opponent slots for the upcoming game.

### Assumptions

- Duplicate colors across opponents are allowed.
- Changes in the opponent overlay apply immediately without a separate save step or close action.
- Default opponent names follow the pattern "Opponent 1" through "Opponent 3".

### Dependencies

- Relies on the existing lobby session flow to carry singleplayer settings into the game start.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 95% of test users can configure opponents (add/remove and set a name and color) in under 60 seconds.
- **SC-002**: 95% of test users can set their desired difficulty in singleplayer within three clicks or fewer.
- **SC-003**: 100% of multiplayer test sessions confirm the lobby controls and behaviors are unchanged.
- **SC-004**: At least 90% of test users successfully start a singleplayer game with zero to three opponents on the first attempt.
