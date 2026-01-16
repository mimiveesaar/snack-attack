# Feature Specification: Snack Attack Lobby System

**Feature Branch**: `001-lobby-system`  
**Created**: 2026-01-16  
**Status**: Draft  
**Input**: User description: "Lobby creation/join flow, lobby management, and active-game handling for Snack Attack"

## User Scenarios & Validation *(mandatory)*

### User Story 1 - Join or Create Lobby (Priority: P1)

A player opens the game, chooses a valid nickname and fish color, and either creates a lobby (no lobby id in URL) or joins an existing lobby (valid `/lobby/{id}` in URL). Duplicate nicknames in the target lobby are suffixed with an incrementing number.

**Why this priority**: Core entry flow; without it no players can gather or play.

**Manual Verification**: Enter page with and without a valid lobby id; submit valid/invalid nicknames; observe successful create/join, deduped nickname, and color selection shown in lobby list.

**Acceptance Scenarios**:

1. **Given** no lobby id in URL, **When** the player submits a valid nickname and color, **Then** a new lobby is created, the player is set as leader, and the lobby view appears with their nickname and color shown.
2. **Given** a valid lobby id with existing players, **When** a new player joins with a nickname that already exists, **Then** the system appends a numeric suffix (e.g., "Alex (2)") and the player appears in the lobby list with the chosen color.

---

### User Story 2 - Manage Lobby Settings (Priority: P2)

The leader distinguishes themselves in the lobby view, selects gamemode (Singleplayer or Multiplayer) and difficulty (Easy/Medium/Hard), copies the share URL, and starts the game. Changing from Multiplayer to Singleplayer immediately removes other players.

**Why this priority**: Lobby settings define playability and capacity; leader control is essential for game start.

**Manual Verification**: In a lobby with multiple players, toggle gamemode and difficulty as leader, observe player list updates, verify share URL copies to clipboard, and confirm only leader can see/start the game button.

**Acceptance Scenarios**:

1. **Given** a multiplayer lobby with 3 players, **When** the leader switches to Singleplayer, **Then** all non-leader players are removed and further joins are blocked until mode changes back.
2. **Given** a lobby, **When** any player clicks Share URL, **Then** the lobby link is copied to the clipboard and can be pasted elsewhere.

---

### User Story 3 - Active Game Joiner Experience (Priority: P3)

A player follows a lobby link while a game is active. They see a waiting view with leaderboard and timer, cannot interrupt the current game, and automatically join the next game if a slot is available when it ends.

**Why this priority**: Prevents disruption of active games while keeping joiners engaged and ready for the next round.

**Manual Verification**: Start a game, then join from another browser/session; confirm the waiting view shows leaderboard and timer, and after the game ends a joiner enters automatically if capacity allows.

**Acceptance Scenarios**:

1. **Given** an active multiplayer game at capacity, **When** a new player opens the lobby link, **Then** they see a waiting view with leaderboard and timer and cannot affect the current game.
2. **Given** the active game ends and the lobby has free slots, **When** the waiting player remains connected, **Then** they are admitted into the lobby for the next game without manual refresh.

### Edge Cases

- Invalid or expired lobby id in URL results in create flow with clear messaging and a new lobby id.
- Nickname containing non-alphanumeric characters is rejected with inline feedback; empty or >31 chars is rejected.
- Duplicate nickname suffix increments correctly when multiple duplicates exist (Alex, Alex (2), Alex (3)).
- Leader disconnect promotes the next player in join order; if none remain the lobby is deleted.
- Switching to Singleplayer with 0 or 1 players keeps leader; switching back to Multiplayer reopens capacity up to 4.
- Clipboard copy failure provides visible error feedback and offers manual copy of the share URL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Enforce nickname validation: length 1-31 characters, alphanumeric only; reject invalid input with inline guidance.
- **FR-002**: When no valid lobby id is present, create a new lobby, assign the first player as leader, and route to the lobby view with shareable id.
- **FR-003**: When a valid lobby id is present, join the existing lobby if capacity allows; if active game is running, place joiner in waiting state.
- **FR-004**: Resolve duplicate nicknames within a lobby by appending incremental numeric suffixes in display name while preserving the user-chosen base name.
- **FR-005**: Allow players to pick a fish color from a predefined palette and display it consistently in lobby lists and waiting view.
- **FR-006**: Allow leader to set gamemode (Singleplayer or Multiplayer) and enforce capacity (1 for Singleplayer, 4 for Multiplayer); switching to Singleplayer immediately removes non-leader players and blocks new joins.
- **FR-007**: Allow leader to set difficulty (Easy, Medium, Hard) and broadcast the selection to all connected players.
- **FR-008**: Provide a share URL action for all players that copies the current lobby link to clipboard with success/failure feedback.
- **FR-009**: Only the leader sees and can trigger the Start Game action; the action must respect current gamemode capacity and lobby membership.
- **FR-010**: Show a player count indicator in the lobby (upper-right), updated in real time as players join/leave or are removed.
- **FR-011**: Promote the next player in join order to leader when the current leader disconnects; delete lobbies that have zero players.
- **FR-012**: Present a waiting view (leaderboard, timer, waiting text) to joiners during an active game and auto-admit them to the next game if a slot is available at game end.
- **FR-013**: Synchronize lobby state (players, leader, gamemode, difficulty, counts, active game status) in real time via the mandated socket-based channel.
- **FR-014**: Enforce rendering constraints: fixed desktop viewport, no responsive layout, no HTML Canvas usage; rely on DOM/SVG-based UI elements.
- **FR-015**: All flows must avoid automated tests; manual validation steps serve as the verification mechanism.

### Key Entities *(include if feature involves data)*

- **Player**: id, nickname (base + display with suffix), color, isLeader flag, connection status, join order.
- **Lobby**: lobbyId, players[], gamemode (single/multi), difficulty (easy/medium/hard), maxPlayers (1 or 4), status (waiting/active), shareUrl, createdAt.
- **GameSession**: sessionId, lobbyId, status (active/ended), timer/remaining time, leaderboard entries, seatsAvailable when transitioning between games.

### Assumptions & Constraints

- Fixed-size desktop viewport; no mobile/responsive requirements.
- Predefined finite color palette; collisions are acceptable because nicknames disambiguate.
- Clipboard API is available in target desktop browsers; if unavailable, a fallback manual copy field is shown.
- Duplicate nickname suffixing starts at (2) and increments sequentially per base name within a lobby.
- Maximum multiplayer capacity is 4; singleplayer capacity is 1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of players create or join a lobby with validated nickname and color within 5 seconds of submitting the form.
- **SC-002**: 100% of duplicate nickname submissions are resolved with visible suffixing and displayed correctly in the lobby list.
- **SC-003**: Switching from Multiplayer to Singleplayer removes all non-leader players and updates lobby capacity within 2 seconds in all connected clients.
- **SC-004**: Leader promotion on disconnect occurs within 2 seconds; lobbies with zero players are removed within 5 seconds.
- **SC-005**: Share URL action succeeds in copying for at least 95% of attempts on supported browsers; failures present fallback within 1 second.
- **SC-006**: Players joining during an active game see the waiting view (leaderboard + timer) within 2 seconds and are auto-admitted to the next game within 5 seconds of game end when capacity allows.
