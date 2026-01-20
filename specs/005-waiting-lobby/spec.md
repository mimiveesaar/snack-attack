# Feature Specification: Waiting Lobby Enhancements

**Feature Branch**: `005-waiting-lobby`  
**Created**: 2026-01-20  
**Status**: Draft  
**Input**: User description: "Change waiting lobby logic so waiting players join immediately after prior game ends; keep them in waiting screen with lobby-full message if lobby has 4 players; show active game leaderboard and timer on waiting screen; improve current implementation."

## Clarifications

### Session 2026-01-20

- Q: During an active game, should new joiners stay in the waiting lobby even if the lobby has open slots? → A: Yes—new joiners stay in the waiting lobby during active games.
- Q: How much of the active game leaderboard should the waiting screen display? → A: Show the full leaderboard (all players).
- Q: What should the waiting screen show for the timer area when no active game exists? → A: Show the timer area with “No active game”.
- Q: Which lobby-full message should be displayed on the waiting screen? → A: “Lobby full (4/4). Waiting for a slot.”
- Q: What is the maximum update latency for waiting-screen leaderboard and timer changes? → A: ≤2 seconds.

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

### User Story 1 - Immediate Lobby Admission (Priority: P1)

As a waiting player, I want to be admitted to the lobby as soon as the prior game ends so that I can play without refreshing or rejoining.

**Why this priority**: This is the core value of the waiting lobby—minimizing delay and confusion after a game finishes.

**Manual Verification**: Join the waiting lobby during an active game, end the game, and observe that the waiting player is moved into the lobby automatically when a slot is available.

**Acceptance Scenarios**:

1. **Given** a waiting player and a lobby with available slots after a game ends, **When** the game finishes, **Then** the waiting player is added to the lobby without manual action.
2. **Given** multiple waiting players and limited slots, **When** the game finishes, **Then** players are admitted in the order they entered the waiting lobby until the lobby is full.

---

### User Story 2 - Waiting Lobby Status Feedback (Priority: P2)

As a waiting player, I want clear status feedback when the lobby is full so I understand why I am not being admitted yet.

**Why this priority**: Prevents confusion and reassures players that the waiting state is intentional when the lobby is at capacity.

**Manual Verification**: Fill the lobby to capacity, place another player in the waiting lobby, and confirm the waiting screen shows a lobby-full message and the player remains waiting.

**Acceptance Scenarios**:

1. **Given** the lobby is full at 4 players, **When** a waiting player checks the waiting screen, **Then** a lobby-full message is displayed and the player remains in the waiting state.

---

### User Story 3 - Watch Active Game Progress (Priority: P3)

As a waiting player, I want to see the current game leaderboard and remaining time so I can gauge how long I will wait.

**Why this priority**: Improves the waiting experience by providing useful, engaging context about the ongoing match.

**Manual Verification**: While a game is active, place a player in the waiting lobby and confirm the waiting screen shows the current leaderboard and the game timer.

**Acceptance Scenarios**:

1. **Given** an active game with a leaderboard, **When** a player is on the waiting screen, **Then** the leaderboard is visible and reflects the current standings.
2. **Given** an active game with remaining time, **When** a player is on the waiting screen, **Then** the remaining time is displayed and updates as the game progresses.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Waiting players exceed lobby capacity and must remain waiting until space opens.
- The active game ends while the waiting screen is visible and the lobby still remains full.
- No active game is in progress (waiting screen should not show stale leaderboard or timer data).
- A waiting player disconnects before the game ends.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST place all players who attempt to join during an active game into a waiting lobby state, even if the lobby has open slots.
- **FR-002**: System MUST move waiting players into the lobby automatically when a game ends and a lobby slot becomes available.
- **FR-003**: System MUST admit waiting players in first-come, first-served order when multiple players are waiting.
- **FR-004**: System MUST keep players on the waiting screen when the lobby is full (4 players).
- **FR-005**: System MUST display a clear lobby-full message on the waiting screen whenever the lobby is at capacity.
- **FR-006**: System MUST show the current active game leaderboard on the waiting screen while a game is in progress.
- **FR-007**: System MUST show the current active game remaining time on the waiting screen while a game is in progress.
- **FR-008**: System MUST remove or hide active game leaderboard and timer information when there is no active game.
- **FR-009**: System MUST display the full active-game leaderboard (all players) on the waiting screen.
- **FR-010**: System MUST keep the timer area visible when no active game exists and display “No active game”.
- **FR-011**: System MUST display the lobby-full message exactly as: “Lobby full (4/4). Waiting for a slot.”
- **FR-012**: System MUST update waiting-screen leaderboard and timer changes within 2 seconds of server updates.

### Assumptions

- Lobby capacity is 4 players and is not configurable in this feature.
- Waiting players are admitted in the order they entered the waiting lobby.
- New joiners remain in the waiting lobby while a game is active.
- Waiting screen updates are near real-time to reflect game end, leaderboard changes, and timer updates.

### Key Entities

- **Waiting Player**: A player not yet admitted to the lobby; attributes include join order, connection status, and current waiting state.
- **Lobby**: The set of players eligible to join the next game; attributes include capacity and current player count.
- **Active Game Snapshot**: The current game’s public status shown to waiting players; includes leaderboard standings and remaining time.
  - When no active game exists, the timer field is displayed as “No active game”.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 95% of waiting players are admitted to the lobby within 2 seconds after a game ends when a slot is available.
- **SC-002**: 100% of waiting players see a lobby-full message whenever the lobby reaches 4 players.
- **SC-003**: 95% of waiting players see the active game leaderboard and remaining time within 1 second of entering the waiting screen.
- **SC-004**: At least 90% of waiting players report that the waiting screen is clear and informative in user feedback or playtest surveys.
- **SC-005**: Waiting-screen leaderboard and timer updates appear within 2 seconds of changes in the active game.
