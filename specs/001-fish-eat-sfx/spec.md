# Feature Specification: Fish Eat Crunch Sound

**Feature Branch**: `001-fish-eat-sfx`  
**Created**: January 21, 2026  
**Status**: Draft  
**Input**: User description: "CReate a new branch for the sound system. In want to play this sound (/home/mimi/snack-attack/src/client/assets/sound/sfx/small-crunch.mp3) each time a fish is eaten."

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

### User Story 1 - Hear crunch on fish eat (Priority: P1)

As a player in an active match, I want to hear a crunch sound every time a fish is eaten so that the action feels responsive and satisfying.

**Why this priority**: Audio feedback for core gameplay events is essential for moment-to-moment feel.

**Manual Verification**: Start a match with sound enabled, trigger fish-eat events, and listen for the crunch sound on each event.

**Acceptance Scenarios**:

1. **Given** sound is enabled and a match is active, **When** any fish is eaten, **Then** a single crunch sound is heard.
2. **Given** sound is enabled and multiple fish are eaten in quick succession, **When** each event occurs, **Then** a crunch sound plays for each event without extra duplicates.
3. **Given** the crunch sound asset is unavailable, **When** a fish is eaten, **Then** gameplay continues without interruption and no crash occurs.

---

### User Story 2 - Respect sound mute (Priority: P2)

As a player who has disabled sound, I do not want to hear the crunch sound when fish are eaten.

**Why this priority**: Players expect audio settings to be respected at all times.

**Manual Verification**: Disable sound in the game settings, trigger fish-eat events, and confirm no crunch sound is heard.

**Acceptance Scenarios**:

1. **Given** sound is disabled, **When** any fish is eaten, **Then** no crunch sound is heard.

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Sound is toggled off during a match between fish-eat events.
- Multiple fish are eaten within the same second.
- The crunch audio asset fails to load or is unavailable.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements
- **FR-001**: System MUST play the provided crunch sound once for every fish-eaten event during an active match when sound is enabled.
- **FR-002**: System MUST NOT play the crunch sound when sound is disabled.
- **FR-003**: System MUST ensure exactly one crunch sound is triggered per fish-eaten event (no missing or duplicate playback).
- **FR-004**: System MUST allow gameplay to continue if the crunch sound asset is unavailable, without blocking or crashing the session.

### Assumptions

- The crunch sound uses the existing in-game sound settings (on/off and volume).
- The sound is only relevant during active gameplay, not in menus or lobbies.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes
- **SC-001**: With sound enabled, players hear the crunch sound for at least 95% of fish-eaten events during a 3-minute manual test.
- **SC-002**: With sound disabled, players hear zero crunch sounds during a 5-minute manual test with fish-eat events.
- **SC-003**: During a test with 20 fish-eat events, players hear 20 distinct crunch sounds (no missing or duplicated sounds).
- **SC-004**: If the sound asset is unavailable, the match remains playable with no gameplay interruption in a full manual session.
