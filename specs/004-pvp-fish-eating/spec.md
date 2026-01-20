# Feature Specification: PvP Fish Eating

**Feature Branch**: `004-pvp-fish-eating`  
**Created**: January 20, 2026  
**Status**: Draft  
**Input**: User description: "I want to implememnt player vs player functionality. I want player fish to be able to eat other player fish if their XP is bigger than the other fish. I want each player fish do display their current xp next to their nicname above the fish. The xp after eating another fish will not be transfered to the other player."

## Clarifications

### Session 2026-01-20

- Q: When a player is respawned after being eaten, what should happen to their XP? → A: Reset XP to baseline/start value.
- Q: When should the respawn occur after being eaten? → A: Follow existing NPC-eat respawn timing.
- Q: Should the higher‑XP player gain any XP for eating a player fish? → A: No, gain no XP from eating players.
- Q: Should respawned players have temporary invulnerability? → A: Yes, follow existing NPC-eat respawn invulnerability rules.
- Q: If two players collide at the exact same moment and have equal XP, what should happen? → A: No respawn; both remain in play.

## User Scenarios & Validation *(mandatory)*

### User Story 1 - Eat Smaller Players (Priority: P1)

As a player with higher XP, I want to eat smaller player fish on contact so that I can force them to respawn and gain an advantage.

**Why this priority**: This is the core PvP mechanic that defines competitive play and determines win conditions during a match.

**Manual Verification**: Join a match with two players of different XP, steer the higher-XP fish into the lower-XP fish, and observe the respawn and XP change outcomes.

**Acceptance Scenarios**:

1. **Given** two players are in the same match and Player B has lower XP than Player A, **When** Player A collides with Player B, **Then** Player B is respawned and Player A remains in play.
2. **Given** Player B is respawned after being eaten, **When** they re-enter play, **Then** Player B’s XP is reset to the baseline/start value.
3. **Given** Player B is eaten by a higher-XP player, **When** the respawn delay completes, **Then** Player B re-enters play using the same timing as NPC-eat respawns.
4. **Given** Player A eats Player B, **When** the collision resolves, **Then** Player A’s XP does not increase from eating a player fish.
5. **Given** Player B has just respawned after being eaten, **When** they re-enter play, **Then** they receive the same temporary invulnerability as NPC-eat respawns.
6. **Given** Player A and Player B collide with equal XP, **When** the collision resolves, **Then** no respawn occurs and both remain in play.

---

### User Story 2 - See XP Above Opponents (Priority: P2)

As a player, I want to see each fish’s current XP next to their nickname above the fish so that I can judge whether I can eat them.

**Why this priority**: Clear visibility of XP supports quick decision-making and reduces confusion during PvP encounters.

**Manual Verification**: Join a match with multiple players and confirm that each fish displays a nickname and an XP value that updates as XP changes.

**Acceptance Scenarios**:

1. **Given** a match is in progress, **When** a player’s XP changes, **Then** the XP value shown next to their nickname updates to the new value.

---

### Edge Cases

- What happens when two players collide at the exact same moment with equal XP? (No respawn should occur.)
- What happens when two players collide simultaneously with a third player (multiple contact events)? (Only players with higher XP should be able to trigger a respawn for smaller players.)
- How does the system handle a player disconnecting during an eating collision? (The remaining player should not receive XP from the disconnected player.)
- What happens if a player’s XP changes at the exact moment of collision? (The system should apply the higher/lower check using the most current XP at collision time.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player fish to trigger another player fish to respawn only when the triggering fish has strictly higher XP at the moment of contact.
- **FR-002**: The system MUST prevent a respawn when the two fish have equal XP or the triggering fish has lower XP.
- **FR-003**: The system MUST return a respawned player to a playable state without ending the match for remaining players.
- **FR-003a**: The system MUST reset a respawned player’s XP to the baseline/start value.
- **FR-003b**: The system MUST use the same respawn timing as the existing NPC-eat respawn behavior.
- **FR-004a**: The system MUST NOT grant XP to the player who eats another player fish.
- **FR-009**: The system MUST apply the same temporary invulnerability rules used by NPC-eat respawns to players who respawn after being eaten by another player.
- **FR-010**: The system MUST NOT trigger a respawn when two colliding players have equal XP.
- **FR-004**: The system MUST ensure that the eliminated player’s XP is not transferred to any other player.
- **FR-005**: The system MUST display each player’s current XP value adjacent to their nickname above the fish during active play.
- **FR-006**: The system MUST keep the XP value synchronized with XP changes during the match.
- **FR-007**: The system MUST keep the nickname and XP label visibly associated with the correct fish as it moves.
- **FR-008**: The system MUST show XP labels for all players currently in the match.

### Key Entities *(include if feature involves data)*

- **Player XP**: Numeric value representing a player’s current growth/strength for PvP eligibility checks and display.
- **Player Fish**: The in-game representation of a player that can collide with other player fish.
- **XP Label**: The visible display combining a player’s nickname and XP value above the fish.

## Assumptions

- Player XP is already tracked per player during a match.
- Existing elimination/respawn behavior (if any) can be reused to return an eliminated player to a playable state.
- The baseline/start XP value is the same as the value used when a player first spawns.
- XP increases from eating are governed by existing progression rules; only transfer of the eliminated player’s XP to others is disallowed.
- Player-eat events do not award XP.
- XP labels are visible to all players during active gameplay.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual test sessions, 100% of collisions where the attacker has higher XP result in the target being respawned.
- **SC-002**: In manual test sessions, 100% of collisions where the attacker has equal or lower XP do not result in a respawn.
- **SC-003**: In manual test sessions, 100% of observed XP labels match the player’s current XP value after XP changes.
- **SC-004**: In a feedback survey, at least 80% of playtesters report that the XP labels help them judge whether they can eat another player.
