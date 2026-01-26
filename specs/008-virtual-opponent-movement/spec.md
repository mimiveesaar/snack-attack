# Feature Specification: Virtual Opponent Movement

**Feature Branch**: `008-virtual-opponent-movement`  
**Created**: 2026-01-26  
**Status**: Draft  
**Input**: User description: "Let's add virtual opponent movement logic. The virtual opponents compete against the player and amongst themselves. The moves of virtual opponents are diverse enough to prevent the game from getting stuck in an endless loop. The virtual opponents cannot interact with game menus, and cannot pause/restart/quit the game. The virtual opponents very closely mimic the performance of real human players."

## Clarifications

### Session 2026-01-26

- Q: How should difficulty scale opponent behavior? → A: Distinct behavior profiles per difficulty (target switching rate, risk tolerance, chase duration).

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

### User Story 1 - Human-Like Opponent Movement (Priority: P1)

As a player in singleplayer, I want virtual opponents to move and compete like real players so the game feels alive and challenging.

**Why this priority**: Core gameplay value depends on opponents behaving convincingly.

**Manual Verification**: Start a singleplayer match with opponents and observe their movement, interactions with the player, and competition among themselves.

**Acceptance Scenarios**:

1. **Given** a singleplayer match with at least one virtual opponent, **When** the game starts, **Then** each opponent moves purposefully and interacts with the arena rather than remaining idle.
2. **Given** multiple virtual opponents, **When** they encounter the player and each other, **Then** they compete for growth and survival in a way comparable to real players.

---

### User Story 2 - Movement Variety Prevents Stalls (Priority: P2)

As a player, I want opponents to vary their movement so the match does not fall into repetitive or stuck patterns.

**Why this priority**: Variety keeps gameplay engaging and prevents stagnation.

**Manual Verification**: Play a 10-minute singleplayer match and observe that opponents do not repeat a single loop or stay idle for extended periods.

**Acceptance Scenarios**:

1. **Given** a singleplayer match with opponents, **When** observing them over time, **Then** their behavior changes in response to situations rather than looping a fixed path.

---

### User Story 3 - Opponents Don’t Control Menus (Priority: P3)

As a player, I want virtual opponents to be limited to gameplay actions so they cannot pause, restart, or quit the game.

**Why this priority**: Prevents disruptive or confusing interactions outside of gameplay.

**Manual Verification**: During a match, confirm no opponent actions trigger pause, restart, or quit flows.

**Acceptance Scenarios**:

1. **Given** a singleplayer match, **When** virtual opponents are active, **Then** the pause/restart/quit states can only be triggered by the player.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Only one opponent is present and still avoids repetitive patterns.
- Opponents collide or crowd each other and must change direction rather than stall.
- Player remains idle; opponents still move and interact with the environment.
- Opponent count is zero; no bot actions are produced.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Virtual opponents MUST move and take gameplay actions that impact outcomes (e.g., growth, survival) in singleplayer matches.
- **FR-002**: Virtual opponents MUST compete with the player and with each other for growth and survival.
- **FR-003**: Virtual opponents MUST vary their movement and decisions enough to avoid repeating a single loop for extended periods.
- **FR-004**: Virtual opponents MUST remain active and responsive while alive, avoiding prolonged idle behavior.
- **FR-005**: Virtual opponents MUST NOT trigger pause, restart, quit, or other game menu actions.
- **FR-006**: Virtual opponent behavior MUST scale with the selected difficulty using distinct behavior profiles per difficulty (e.g., target switching rate, risk tolerance, chase duration).
- **FR-007**: Behavior variation MUST be per-opponent so multiple opponents do not behave identically in the same match.

### Key Entities *(include if feature involves data)*

- **Virtual Opponent**: A non-human competitor that participates in gameplay actions and movement.
- **Opponent Behavior Profile**: Defines how an opponent moves and reacts under different situations.

### Assumptions

- Virtual opponents are only used in singleplayer matches.
- Difficulty selection influences opponent effectiveness and decision frequency.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: In a 10-minute singleplayer match, no virtual opponent remains stationary for more than 15 seconds while alive.
- **SC-002**: In a 10-minute singleplayer match, each active virtual opponent changes its movement direction or target at least once every 20 seconds.
- **SC-003**: In playtests, at least 80% of participants rate virtual opponent skill as “similar to real players” for the chosen difficulty.
- **SC-004**: During matches with multiple opponents, at least two distinct opponents gain XP within the first 60 seconds.
