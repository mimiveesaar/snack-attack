# Feature Specification: Snack Attack Active Game Mechanics

**Feature Branch**: `002-active-game`  
**Created**: 2026-01-17  
**Status**: Draft  
**Input**: User description from game-description.md

## User Scenarios & Validation *(mandatory)*

### User Story 1 - Core Gameplay Loop (Priority: P1)

Players enter a 2-minute timed match where they control a fish avatar in a shared game world. The core loop involves navigation, encountering other fish (NPCs and players), and eating smaller fish to gain XP and grow. The player with the most XP when the timer reaches zero wins.

**Why this priority**: This is the foundational experience—without a working game loop and eating mechanic, there is no game. All other features depend on this.

**Manual Verification**: Start a 1-player game, observe fish spawn, move the player fish, encounter an NPC, collide and eat it (if XP permits), verify XP increases, timer counts down, game ends at 0:00 with leaderboard displayed.

**Acceptance Scenarios**:

1. **Given** a new game session, **When** the game starts, **Then** player fish spawns at a safe location, timer displays 2:00, and NPCs begin spawning in the world
2. **Given** player fish has XP > NPC fish XP, **When** they collide, **Then** NPC is eaten, player gains NPC's XP, NPC despawns
3. **Given** player fish has XP < NPC fish XP, **When** they collide, **Then** player is eaten, player respawns at base XP after 2s delay, NPC remains
4. **Given** two fish with equal XP collide, **When** they touch, **Then** neither is eaten
5. **Given** game is active, **When** timer reaches 0:00, **Then** game ends and leaderboard is displayed with scores

---

### User Story 2 - Fish Growth & Progression (Priority: P1)

As a player accumulates XP by eating fish, their fish grows visually and mechanically through 3 distinct phases. Growth is cosmetic (size + collision radius) but makes the player's capability to eat larger NPCs more apparent. Specific XP thresholds trigger growth.

**Why this priority**: Growth is core progression feedback and motivates continued play; players need to see their power increasing. Critical for engagement.

**Manual Verification**: Play a game, accumulate XP by eating small NPCs, observe fish size increasing at 2 threshold points, verify collision radius changes match size, confirm movement speed and eating rules remain unchanged, finish game and verify final size matches final XP level.

**Acceptance Scenarios**:

1. **Given** player fish starts at growth phase 1 (base size), **When** XP reaches 50 points, **Then** fish transitions to growth phase 2 (visual size increases, collision radius increases)
2. **Given** fish is at growth phase 2, **When** XP reaches 150 points, **Then** fish transitions to growth phase 3 (larger size, larger collision radius)
3. **Given** fish grows to phase 3, **When** it eats an NPC, **Then** XP gain rules apply unchanged (movement speed and eating mechanics unaffected)

---

### User Story 3 - NPC Fish Spawning & Behavior (Priority: P1)

NPC fish spawn randomly in the game world and move passively (loitering, no active pursuit of players). Three NPC types exist with different fixed XP values: Pink (low), Grey (medium), Brown (high), with Pink being most common and Brown rarest. NPCs obey world boundaries and never spawn on top of players. Eaten NPCs despawn; new NPCs respawn to maintain population.

**Why this priority**: NPCs drive core gameplay—they are the primary target for eating and the source of progression. Without NPCs, there is no food chain and no game.

**Manual Verification**: Start a game, observe multiple NPC types spawn over time with appropriate frequency ratios, verify they move without chasing the player, eat a Pink NPC (should be easy), attempt to eat a Brown NPC (should require growth first), verify eaten NPCs disappear and new ones spawn, check that spawn locations are not on top of player fish.

**Acceptance Scenarios**:

1. **Given** game is active, **When** the game starts, **Then** Pink NPCs begin spawning (most frequent), followed by Grey NPCs, and Brown NPCs (rarest)
2. **Given** an NPC is spawned, **When** it occupies the game world, **Then** it moves passively without pursuing the player
3. **Given** player collides with and eats an NPC, **When** the NPC is consumed, **Then** the NPC despawns and is replaced by a new NPC of the same or different type
4. **Given** player is at spawn location, **When** new NPCs spawn, **Then** NPCs do not spawn within minimum safe distance of player

---

### User Story 4 - Player Respawn & Recovery (Priority: P2)

When a player fish is eaten, the player sees a brief respawn screen and their fish re-enters the game world at a random location at base size and base XP after a 2-second delay. The respawned fish has a brief grace period (2 seconds) where it cannot be eaten, allowing the player to regain control. Any active power-up is lost upon eating.

**Why this priority**: Respawn recovery is important for fairness—players should not be stuck in a death loop. Grace period prevents frustrating immediate re-eating. High priority but not foundational like core loop.

**Manual Verification**: Get eaten by an NPC, observe 2-second respawn timer, watch fish respawn at random location with base size, attempt to immediately collide with NPC (should not be eaten for 2s), verify power-up is gone if one was active, resume playing.

**Acceptance Scenarios**:

1. **Given** player fish is eaten, **When** the eating collision resolves, **Then** respawn screen displays for 2 seconds
2. **Given** respawn timer completes, **When** fish respawns, **Then** it appears at a random safe location with base size and base XP
3. **Given** respawned fish is in grace period, **When** it collides with an NPC, **Then** the fish is not eaten until grace period expires
4. **Given** player had an active power-up when eaten, **When** fish respawns, **Then** the power-up is lost

---

### User Story 5 - Power-ups & Temporary Boosts (Priority: P2)

A single power-up spawns in the world at a time. Only playable fish can collect them (NPCs cannot). Two types exist: Speed Boost (1.2x movement speed for 10s) and Double XP (2x XP gain from eaten fish for 10s). Active power-ups are overwritten if a new power-up spawns. Power-ups do not tick down while the game is paused. Power-ups are lost if the player is eaten.

**Why this priority**: Power-ups add dynamic strategy and excitement. They are not core to basic gameplay but enhance player agency and moment-to-moment decision-making. Can be shipped after core loop is stable.

**Manual Verification**: Play game, observe a power-up spawn and pick it up, notice movement speed increase or XP doubling, watch timer tick down 10s, observe buff wear off, get eaten and verify buff is lost and must be re-collected.

**Acceptance Scenarios**:

1. **Given** game is active, **When** a power-up spawns, **Then** only one power-up is active in the world at a time
2. **Given** player fish collects a Speed Boost power-up, **When** it is active (10s), **Then** movement speed is 1.2x normal
3. **Given** player fish collects a Double XP power-up, **When** it is active (10s), **Then** XP gained from eating is doubled
4. **Given** power-up is active, **When** game is paused, **Then** power-up timer does not tick down
5. **Given** player has an active power-up, **When** player is eaten, **Then** power-up is lost

---

### User Story 6 - Leaderboard & Live Scoring (Priority: P2)

A sidebar leaderboard displays all active players ranked by current score (XP). The leader is marked (in case they are also the pause-controlling player). If a player quits or is removed, the leaderboard shows them as "Quit" with their final score. The leaderboard updates in real-time as scores change.

**Why this priority**: Leaderboard provides social engagement and competition feedback. Real-time updates keep players informed of standings. Important for multiplayer engagement but secondary to core gameplay.

**Manual Verification**: Start a 2-player game, observe both players on leaderboard with their scores, eat an NPC and verify your score updates instantly on leaderboard, quit the game and verify your name shows as "Quit" with final score preserved, verify leader indicator shows who has highest score.

**Acceptance Scenarios**:

1. **Given** game is active with multiple players, **When** a player eats an NPC, **Then** leaderboard updates immediately to reflect new score
2. **Given** leaderboard is displayed, **When** players are ranked, **Then** highest score is at the top and player with pause control is marked
3. **Given** player quits the game, **When** they disconnect, **Then** leaderboard shows their name with "Quit" status and final score

---

### User Story 7 - Game Pause & Resume (Priority: P2)

Only the lobby leader can pause the game. When paused, the timer stops, all fish movement freezes, and a pause overlay indicates the leader paused the game. Only the leader can resume; other players see a "quit" option. The leader can pause at any time.

**Why this priority**: Pause is important for tournament play and allows leader control over pacing. Secondary to core gameplay but essential for multiplayer experience.

**Manual Verification**: As leader, press pause button and observe game freezes with overlay message, verify timer stopped, try to control fish (should not respond), press resume as leader and observe game unfreezes, as non-leader player attempt to pause (button disabled) and observe "quit" option instead.

**Acceptance Scenarios**:

1. **Given** leader is in-game, **When** they press pause, **Then** game freezes, timer stops, overlay shows pause message
2. **Given** game is paused, **When** leader presses resume, **Then** game unfreezes and timer resumes
3. **Given** game is paused, **When** non-leader player tries to pause, **Then** pause button is disabled and only quit option is available

---

### User Story 8 - Game End & Results Screen (Priority: P1)

When the timer reaches zero or all players quit, a results screen displays the final leaderboard, identifies the winner, and provides options to return to lobby or create a new game. Results show final scores and rankings.

**Why this priority**: End-game closure is essential—players need to see results and have a clear path to next action. This is the conclusion of the game experience and critical for satisfaction.

**Manual Verification**: Play until timer reaches 0:00, observe results screen with leaderboard and winner highlighted, click "Return to Lobby" and verify navigation back to lobby, click "New Game" and verify new match starts.

**Acceptance Scenarios**:

1. **Given** timer reaches 0:00, **When** game ends, **Then** results screen displays with final leaderboard, winner, and scores
2. **Given** results screen is shown, **When** player clicks "Return to Lobby", **Then** player returns to lobby view
3. **Given** results screen is shown, **When** player clicks "New Game", **Then** a new game session initiates (or returns to lobby for new session setup)

---

### User Story 9 - Sidebar UI & Real-time Information (Priority: P2)

A sidebar on the right displays: player's current score, a "Fish-o-meter" progress bar showing growth phase and progress to next phase, live leaderboard, help button (rules), pause button (leader only), and quit button (all players).

**Why this priority**: Sidebar provides essential HUD information and controls. Players need to see their progress and standings. Important for UX but depends on core mechanics being stable first.

**Manual Verification**: Open sidebar, verify score updates in real-time, check Fish-o-meter shows current growth phase and fills based on XP progress to next phase, see help button opens rules, see pause button only if you are leader, see quit button always available, watch leaderboard update as game progresses.

**Acceptance Scenarios**:

1. **Given** game is active, **When** player looks at sidebar, **Then** current score is displayed and updates in real-time
2. **Given** Fish-o-meter is shown, **When** player eats fish and gains XP, **Then** progress bar fills proportionally and shows phase transition moments
3. **Given** sidebar is displayed, **When** player is not leader, **Then** pause button is disabled and only quit and help buttons are available

---

### Edge Cases

- What happens when all players quit during a game? → Game ends immediately, results screen shows final scores with "Quit" status for all.
- What happens when a player's connection drops during gameplay? → Player's fish is removed from world, score remains on leaderboard as "Quit", game continues for others.
- What happens if a player eats multiple fish in the same tick? → Server deterministically resolves collisions in joinOrder sequence; first eligible eat removes that fish, subsequent collisions re-evaluate.
- What happens if a power-up spawns where a player is located? → Power-up spawns at different location; no collision occurs on spawn.
- What happens if growth thresholds are met during the same eat that kills a player? → Growth applies to the eaten NPC's XP transfer; XP gain respects the existing (pre-growth) cap.
- What happens if player respawns on top of another player? → Spawn location re-evaluates; minimum safe distance enforced for all players.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Game MUST maintain a 2-minute countdown timer that starts on game begin and ends when it reaches 0:00
- **FR-002**: Game MUST support collision detection between player fish, NPC fish, and boundaries; collisions are server-authoritative and deterministic per tick
- **FR-003**: System MUST enforce XP-based eating rules: fish A can eat fish B only if XP(A) > XP(B); if equal, neither eats
- **FR-004**: Playable fish MUST grow through 3 phases: phase 1 at 0 XP, phase 2 at 50+ XP, phase 3 at 150+ XP; growth changes size and collision radius only
- **FR-005**: NPCs MUST spawn randomly with frequency ratios: Pink (60%), Grey (30%), Brown (10%); each type has fixed XP (Pink: 10, Grey: 25, Brown: 50)
- **FR-006**: NPCs MUST move passively (loitering) without pursuing players and MUST respect world boundaries (0-500 in X and Y)
- **FR-007**: When a player fish is eaten, it MUST respawn after 2 seconds at a random safe location with base size, base XP, and a 2-second grace period
- **FR-008**: System MUST track and broadcast real-time leaderboard showing all players ranked by score
- **FR-009**: Game MUST support power-ups: one active at a time, Speed Boost (1.2x speed for 10s), Double XP (2x gain for 10s); power-ups lost on player death
- **FR-010**: Game MUST broadcast game state updates to all clients at least 10 times per second (10Hz minimum)
- **FR-011**: Only lobby leader MUST have ability to pause/resume game; timer pauses when game is paused
- **FR-012**: When timer ends, game MUST end and display results screen with final leaderboard, winner, and navigation options
- **FR-013**: Player MUST be able to quit game at any time; quitting removes player's fish from world and marks player as "Quit" on leaderboard

### Key Entities

- **Fish**: A character in the game world with position (X, Y), size (growth phase), XP, color, and collision radius. Can be player-controlled or NPC.
- **Player Fish**: Controllable fish tied to a lobby player; gains XP by eating, grows, can be eaten and respawn, affected by power-ups.
- **NPC Fish**: Non-player fish with fixed XP and passive AI; spawns randomly, despawns when eaten, does not grow or gain XP.
- **Power-up**: Temporary buff (Speed Boost or Double XP) spawnable in world, collectible only by player fish, duration 10s, lost on death.
- **Collision Event**: Server-resolved interaction between two fish; determines eating, damage, or no effect based on XP comparison.
- **Leaderboard Entry**: Snapshot of player name, score, rank, and quit status; updated in real-time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can start a game, control their fish, and encounter NPCs within 3 seconds of game start
- **SC-002**: Collision detection and eating mechanics trigger correctly 100% of the time for deterministic server-side resolution
- **SC-003**: Fish growth occurs visually at the correct XP thresholds (50 and 150) and collision radii adjust accordingly
- **SC-004**: NPCs spawn with correct frequency ratios (60% Pink, 30% Grey, 10% Brown) over a 30-second observation window
- **SC-005**: Player respawn after death occurs within 2-3 seconds and places player at a safe location
- **SC-006**: Leaderboard updates are broadcast to all clients within 500ms of a score change
- **SC-007**: 2-minute game completes without crashing or losing state for up to 4 concurrent players
- **SC-008**: Pause/resume toggles work correctly and only leader can initiate
- **SC-009**: Power-up collection and effects (speed, double XP) are visible and work as described for 10-second duration
- **SC-010**: Game end results screen displays winner and final leaderboard with 100% accuracy
- **SC-011**: Players report clarity and satisfaction with understanding gameplay rules and mechanics (post-game survey: 80% "clear" or higher)

## Assumptions

- Game world is fixed 500x500 pixel canvas with no scrolling or infinite space
- Movement is continuous but collision checks happen once per server tick (60 FPS = ~16.67ms per tick)
- XP thresholds for growth (50, 150) are reasonable and can be tuned based on playtesting; actual values can be adjusted in configuration
- Power-up spawn frequency and location are randomly determined; details of spawn logic can be implemented during development
- "Leader" is the player who created the lobby and has pause/resume privileges; this is inherited from lobby system
- Sound effects are local to each client and do not affect gameplay (can be added post-MVP)
- Minimum safe spawn distance is 50 pixels from any player fish

## Notes

- This specification focuses on the active game experience and assumes lobby system (001-lobby-system) is already implemented
- Game server runs on the same Node.js + Socket.IO infrastructure as lobby system
- Client rendering uses DOM/CSS/SVG only; no HTML Canvas per constitution
- No automated testing; manual validation only
- Collision resolution is server-authoritative to prevent cheating; client-side prediction can be added for perceived responsiveness but server is source of truth
