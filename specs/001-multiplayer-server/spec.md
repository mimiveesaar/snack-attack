# Feature Specification: Multiplayer Server v1

**Feature Branch**: `001-multiplayer-server`  
**Created**: 19 January 2026  
**Status**: Draft  
**Input**: User description: "Let's start implementing the first version of multiplayer. Only focus on the server. When gamemode is set to singleplayer, it will still use multiplayer under the hood, just player count is restricted to 1. The game is started when start game is called by lobby-orchestrator. Game-store should handle active game sessions, game-orchestrator should manage active game sessions, lobby-controller should handle SocketIO events. When player disconnects/loses connection it should be broadcast to other players in the room. When a player connects, he should send a ready packet with his playerId, so player from the lobby can associated with his socketId. To ensure things happen at the same speed regardless if the server lags. Instead of moving \"per frame,\" you move in Fixed Timesteps. (60 tps) The server should broadcast the array of hostiles (other players/npcs), that contains (entity id, vec2, velocity)."

## Clarifications

### Session 2026-01-19

- Q: How often should hostile snapshots be broadcast? → A: Every simulation tick (60 Hz).
- Q: What should happen to a session when the last player disconnects? → A: End the session immediately.
- Q: Which connection should remain when a duplicate ready association occurs? → A: Keep the newest connection and drop the previous one.
- Q: When should a ready packet be acknowledged? → A: Only after validating the player id against the lobby.
- Q: How should the server respond to an invalid ready packet? → A: Respond with an error and allow retry.
- Q: What happens if not all players are ready before session start? → A: Start anyway with whoever is ready.
- Q: Can players join after a session has started? → A: No, players cannot join mid-game.

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

### User Story 1 - Start and run a multiplayer session (Priority: P1)

As a player in a lobby, I want the game to start and receive live session updates so that everyone in the lobby can play together.

**Why this priority**: This is the core multiplayer experience and the minimum viable server behavior.

**Manual Verification**: Start a lobby game, connect two clients, send ready packets, and observe that both clients receive tick packets at a steady cadence.

**Acceptance Scenarios**:

1. **Given** a lobby with two players, **When** the lobby start signal is issued, **Then** an active game session is created and begins broadcasting state updates.
2. **Given** connected players who have sent ready packets, **When** the game session is running, **Then** each player receives tick packets containing hostile snapshot data (entity id, position (x,y), velocity) for all non-local entities.

---

### User Story 2 - Handle player disconnects (Priority: P2)

As a player in a session, I want to be informed when another player disconnects so that I can understand who is still in the game.

**Why this priority**: Maintaining consistent session state requires timely disconnect handling.

**Manual Verification**: Join a session with two players, then disconnect one client and observe that the remaining client receives a disconnect notification.

**Acceptance Scenarios**:

1. **Given** an active session with multiple players, **When** one player disconnects or loses connection, **Then** remaining players receive a disconnect notification for that player.

---

### User Story 3 - Singleplayer uses the same multiplayer flow (Priority: P3)

As a player choosing singleplayer mode, I want the game to use the same multiplayer flow while limiting the session to one player.

**Why this priority**: Ensures a single server path for session management and reduces special-case behavior.

**Manual Verification**: Start a singleplayer lobby, connect one client, then attempt to connect a second client and verify it is rejected or prevented.

**Acceptance Scenarios**:

1. **Given** a lobby set to singleplayer mode, **When** a second player attempts to join, **Then** the system prevents the join and keeps the active session limited to one player.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Ready packet arrives with an unknown or non-lobby player id.
- Ready packet is sent multiple times or from multiple connections for the same player id.
- Player disconnects during session start or before sending ready packet.
- Session receives a start signal when already active.
- Server experiences lag spikes during active session updates.
- All players disconnect from an active session.
- Invalid ready packet is sent and retried.
- Not all players become ready before session start.
- Player attempts to join or ready after the session is already active.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST create or activate a game session when a lobby start signal is issued.
- **FR-002**: System MUST maintain a list of active game sessions and support lookup by lobby or session identifier.
- **FR-003**: System MUST accept a ready packet containing a player id and associate it with the player's live connection.
- **FR-003a**: System MUST validate the player id against the lobby before acknowledging the ready packet.
- **FR-004**: System MUST ignore or reject gameplay participation from connections that have not completed the ready association.
- **FR-005**: System MUST broadcast hostile snapshots to all players in a session every simulation tick (60 Hz), where each snapshot includes entity id, position (x,y), and velocity for every non-local entity.
- **FR-006**: System MUST advance game state in fixed 60-tick-per-second steps and compensate for server lag by processing multiple fixed steps when needed.
- **FR-007**: System MUST broadcast a disconnect notification to all remaining players in the same session when a player disconnects or loses connection.
- **FR-008**: System MUST enforce player count limits based on game mode, with singleplayer sessions capped at one player while using the same session flow.
- **FR-009**: System MUST include both other players and NPCs in the hostile snapshots for each player.
- **FR-010**: System MUST resolve duplicate ready associations for the same player id by keeping the newest connection and invalidating the previous one.
- **FR-011**: System MUST end the game session immediately when the last player disconnects.
- **FR-012**: System MUST respond to an invalid ready packet with an error while keeping the connection open for retry.
- **FR-013**: System MUST start the session with the currently ready players even if some lobby players are not ready.
- **FR-014**: System MUST reject attempts to join or ready after the session has started; mid-game joins are not allowed.

### Key Entities *(include if feature involves data)*

- **Game Session**: Represents an active multiplayer match, including lobby reference, game mode, player roster, and session lifecycle status.
- **Player Connection**: Represents the mapping between a player id and a live connection, including ready state and connection status.
- **Hostile Snapshot**: Represents a collection of non-local entities with id, position (x,y), and velocity for broadcast.

### Requirement Acceptance Criteria

- **FR-001**: Issuing a lobby start signal results in one active session for that lobby.
- **FR-002**: Active sessions can be listed and a session can be retrieved using its lobby or session identifier.
- **FR-003**: A ready packet containing a valid player id creates or updates a player-to-connection association.
- **FR-003a**: A ready packet is acknowledged only after the player id is confirmed as a member of the lobby.
- **FR-004**: A connection without a ready association cannot receive or contribute to session gameplay updates.
- **FR-005**: Each hostile snapshot is broadcast every simulation tick (60 Hz) and includes every non-local entity with id, position (x,y), and velocity.
- **FR-006**: During lag, multiple fixed steps are processed to keep the simulation aligned to 60 steps per second.
- **FR-007**: Remaining players receive a disconnect notification when any player connection ends.
- **FR-008**: Singleplayer sessions never exceed one active player connection.
- **FR-009**: Hostile snapshots include other players and NPCs.
- **FR-010**: When a duplicate ready association is received, the newest connection remains active and the previous one is disconnected.
- **FR-011**: When the last player disconnects, the session ends immediately and is removed from the active sessions list.
- **FR-012**: Invalid ready packets result in an error response and allow the client to retry without reconnecting.
- **FR-013**: Session start proceeds with the subset of ready players and excludes those not ready.
- **FR-014**: Ready packets from players not in the active session are rejected once the session is active.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Game sessions begin broadcasting their first hostile snapshot within 2 seconds of the lobby start signal in 95% of attempts.
- **SC-002**: Game state advances at a fixed 60-tick-per-second cadence with no more than 1% deviation over a continuous 5-minute session.
- **SC-003**: Disconnect notifications reach remaining players within 2 seconds in 95% of disconnect events.
- **SC-004**: Singleplayer sessions prevent additional player joins in 100% of attempts during an active session.

## Assumptions

- Lobby start signals provide enough context to identify the lobby and desired game mode.
- Player ids in ready packets are already validated as members of the lobby.
- The most recent ready association for a player id replaces any previous connection.
- Connection loss is detected via the real-time connection lifecycle events.
