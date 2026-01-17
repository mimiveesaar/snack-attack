---
description: "Tasks for Snack Attack Active Game Mechanics"
---

# Tasks: Snack Attack Active Game Mechanics

**Input**: Design documents from `/specs/002-active-game/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Constitutional Note**: No automated tests. Manual validation only. Stack is Node.js + TypeScript (strict) + Lit + Socket.IO; HTML Canvas prohibited; fixed 500×500 desktop viewport. Manager/entity pattern for client; controller/orchestrator for server.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5, US6, US7, US8, US9)
- Include exact file paths in descriptions

## Phase 1: Setup & Infrastructure (Shared Foundation)

- [x] T001 Wire `/game` namespace and game controller in server socket bootstrap in [src/server/index.ts](src/server/index.ts)
- [x] T002 [P] Create game session state management layer with in-memory storage in [src/server/game/state.ts](src/server/game/state.ts)
- [x] T003 [P] Implement clock synchronization handshake (ping/pong + offset calculation) in [src/server/game/clock.ts](src/server/game/clock.ts)
- [x] T004 [P] Create shared game event types and Socket.IO event schemas in [src/shared/game-events.ts](src/shared/game-events.ts) (extend contracts)
- [x] T005 Setup game scene component scaffold with fixed 500×500 canvas layout in [src/client/game/components/game-scene.ts](src/client/game/components/game-scene.ts)
- [x] T006 [P] Create scene controller to route between lobby and game views in [src/client/game/scene-controller.ts](src/client/game/scene-controller.ts)
- [x] T007 [P] Implement game HUD overlay template (timer, pause button, end screen) in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts)

## Phase 2: Foundation - Core Game Loop & Physics

- [x] T008 Implement server-side 60 Hz fixed timestep game loop in [src/server/game/loop.ts](src/server/game/loop.ts)
- [x] T009 [P] Build server game controller to route `player-ready`, `player-input`, `pause-toggle`, `player-quit` events in [src/server/game/controller.ts](src/server/game/controller.ts)
- [x] T010 [P] Create game orchestrator to manage active sessions in [src/server/game/orchestrator.ts](src/server/game/orchestrator.ts)
- [x] T011 [P] Implement collision detection module (XP-based eating, boundary checks, grace period) in [src/server/game/collision.ts](src/server/game/collision.ts)
- [x] T012 Implement client-side input controller to capture keyboard movement in [src/client/game/input-controller.ts](src/client/game/input-controller.ts)
- [x] T013 [P] Create client engine with requestAnimationFrame tick loop in [src/client/game/engine.ts](src/client/game/engine.ts)
- [x] T014 [P] Build client physics module for prediction + entity interpolation in [src/client/game/physics.ts](src/client/game/physics.ts)

## Phase 3: User Story 1 - Core Gameplay Loop (Priority: P1) 🎯 MVP

**Goal**: Players can move a fish, encounter NPCs, eat them (if XP permits), gain score, and finish a 2-minute game.
**Manual Verification**: Start game, move fish with arrow keys, eat Pink NPC, verify score increases, wait for timer end, verify results screen.

### Implementation

- [x] T015 [P] [US1] Create visual entity base class with position, state, lifecycle in [src/client/game/entities/visual-entity.ts](src/client/game/entities/visual-entity.ts)
- [x] T016 [P] [US1] Implement Fish entity with size, color, animation states in [src/client/game/entities/fish.ts](src/client/game/entities/fish.ts)
- [x] T017 [US1] Build player renderer manager to render self-controlled player fish with predicted position in [src/client/game/managers/player-renderer.ts](src/client/game/managers/player-renderer.ts)
- [x] T018 [US1] Initialize game session on server when lobby starts with `/game` room and player state setup in [src/server/game/orchestrator.ts](src/server/game/orchestrator.ts) (extend T010)
- [x] T019 [US1] Implement `game:state-update` broadcast at 10 Hz with player positions, velocities, leaderboard in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T020 [US1] Wire client state subscription to render player position + velocity on state update in [src/client/game/scene-controller.ts](src/client/game/scene-controller.ts) (extend T006)
- [ ] T021 [US1] Implement 2-minute countdown timer with 1s tick broadcast in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008); render in HUD in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T007)
- [x] T022 [US1] Create NPC entity and hostile renderer manager to spawn and render all NPCs in [src/client/game/managers/hostile-renderer.ts](src/client/game/managers/hostile-renderer.ts)
- [x] T023 [P] [US1] Implement server-side NPC spawning logic (Pink/Grey/Brown with frequency/cap limits) in [src/server/game/npc-spawner.ts](src/server/game/npc-spawner.ts)
- [x] T024 [US1] Implement eating collision logic: resolve in joinOrder, transfer XP, despawn NPC, update leaderboard in [src/server/game/collision.ts](src/server/game/collision.ts) (extend T011)
- [x] T025 [P] [US1] Build leaderboard display component updating in real-time in [src/client/game/components/leaderboard.ts](src/client/game/components/leaderboard.ts)
- [ ] T026 [US1] Implement game end at 0:00 with results screen (winner, final leaderboard, navigation buttons) in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T007)
- [ ] T027 [US1] Handle graceful game end on server, broadcast `game:ended` event with final leaderboard in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)

## Phase 4: User Story 2 - Fish Growth & Progression (Priority: P1)

**Goal**: Players' fish grow through 3 phases (0→50→150 XP), visual size and collision radius change.
**Manual Verification**: Accumulate 50 XP, observe size increase and phase 2 indicator; reach 150 XP, observe phase 3 size; verify collision radius matches (can eat larger NPCs).

### Implementation

- [ ] T028 [P] [US2] Compute growth phase from player XP (0-49=1, 50-149=2, 150+=3) and sync to client in [src/server/game/state.ts](src/server/game/state.ts) (extend T002)
- [ ] T029 [P] [US2] Update player renderer to scale fish visual size based on growth phase in [src/client/game/managers/player-renderer.ts](src/client/game/managers/player-renderer.ts) (extend T017)
- [ ] T030 [P] [US2] Update hostile renderer to reflect NPC visual sizes per type in [src/client/game/managers/hostile-renderer.ts](src/client/game/managers/hostile-renderer.ts) (extend T022)
- [ ] T031 [US2] Implement collision radius scaling in collision detection per growth phase in [src/server/game/collision.ts](src/server/game/collision.ts) (extend T024)
- [ ] T032 [P] [US2] Create Fish-O-Meter UI component showing XP progress bar and growth phase indicators in [src/client/game/components/fish-o-meter.ts](src/client/game/components/fish-o-meter.ts)
- [ ] T033 [US2] Update sidebar to display current Fish-O-Meter progress and phase in real-time in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts)

## Phase 5: User Story 3 - NPC Spawning & Behavior (Priority: P1)

**Goal**: NPC fish spawn randomly (Pink 60%, Grey 30%, Brown 10%), move passively, no spawn on players.
**Manual Verification**: Observe NPC variety, count spawn frequency ratios over 30s, verify no NPC spawns on player, confirm passive movement without player pursuit.

### Implementation

- [ ] T034 [US3] Implement NPC loitering AI (passive random walk, no pursuit of players) in [src/server/game/npc-spawner.ts](src/server/game/npc-spawner.ts) (extend T023)
- [ ] T035 [P] [US3] Implement spawn safety check (50px minimum distance from any player) in [src/server/game/npc-spawner.ts](src/server/game/npc-spawner.ts) (extend T023)
- [ ] T036 [P] [US3] Set NPC max concurrent limits per type (Pink 5, Grey 3, Brown 1) with spawn frequency throttling in [src/server/game/npc-spawner.ts](src/server/game/npc-spawner.ts) (extend T023)
- [ ] T037 [US3] Verify NPC spawn frequency ratios match spec (Pink ~1.5s, Grey ~4s, Brown ~8s) via manual observation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md) (validation task)

## Phase 6: User Story 4 - Player Respawn & Recovery (Priority: P2)

**Goal**: Players respawn 2s after eaten, at random safe location, base XP, with 2s grace period.
**Manual Verification**: Get eaten, observe 2s respawn delay, respawn at new location with base size, try to get eaten immediately (should fail for 2s grace), after grace expires confirm eating works again.

### Implementation

- [ ] T038 [P] [US4] Implement respawn state machine and tracking in server player state in [src/server/game/state.ts](src/server/game/state.ts) (extend T002)
- [ ] T039 [P] [US4] Implement grace period logic: block eating for 2s after respawn in collision detection in [src/server/game/collision.ts](src/server/game/collision.ts) (extend T031)
- [ ] T040 [US4] Generate random safe respawn position (50px min distance) in [src/server/game/npc-spawner.ts](src/server/game/npc-spawner.ts) (extend T035)
- [ ] T041 [P] [US4] Handle respawn state transitions and XP reset on server in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T042 [P] [US4] Render respawning player state (visual indicator, disabled input) on client in [src/client/game/managers/player-renderer.ts](src/client/game/managers/player-renderer.ts) (extend T029)
- [ ] T043 [US4] Emit `game:collision` event on respawn-complete for client animation feedback in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T027)

## Phase 7: User Story 5 - Power-ups & Temporary Boosts (Priority: P2)

**Goal**: One power-up active at a time, Speed Boost (1.2x speed 10s) or Double XP (2x gain 10s), spawn every 15s, lost on death.
**Manual Verification**: Collect power-up, observe speed increase or XP doubling for 10s, watch buff expire, get eaten and verify buff is lost and must be recollected.

### Implementation

- [ ] T044 [P] [US5] Create PowerUp entity and rendering in [src/client/game/entities/powerup.ts](src/client/game/entities/powerup.ts)
- [ ] T045 [P] [US5] Build powerup renderer manager in [src/client/game/managers/powerup-renderer.ts](src/client/game/managers/powerup-renderer.ts)
- [ ] T046 [US5] Implement server-side power-up spawning (15s interval, random type 50/50, safe location) in [src/server/game/powerup-spawner.ts](src/server/game/powerup-spawner.ts)
- [ ] T047 [US5] Implement power-up collision detection and collection logic in [src/server/game/collision.ts](src/server/game/collision.ts) (extend T031)
- [ ] T048 [P] [US5] Implement Speed Boost effect (1.2x movement speed) in server physics in [src/server/game/state.ts](src/server/game/state.ts) (extend T002)
- [ ] T049 [P] [US5] Implement Double XP effect (2x gain on eaten fish) in collision XP transfer in [src/server/game/collision.ts](src/server/game/collision.ts) (extend T047)
- [ ] T050 [US5] Implement power-up expiration tracking (10s duration, pause when game paused) in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T051 [P] [US5] Broadcast `game:power-up-gained` and `game:power-up-lost` events for client UI feedback in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T052 [US5] Clear power-ups on player eaten in respawn logic in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T041)

## Phase 8: User Story 6 - Leaderboard & Live Scoring (Priority: P2)

**Goal**: Real-time leaderboard showing players ranked by XP, leader marked, quit players frozen with score.
**Manual Verification**: Play 2-player game, watch scores update instantly, quit as one player, verify name shows "Quit" with final score frozen, verify rankings stay accurate.

### Implementation

- [ ] T053 [P] [US6] Compute and update leaderboard on every XP change in server state in [src/server/game/state.ts](src/server/game/state.ts) (extend T002)
- [ ] T054 [P] [US6] Broadcast leaderboard in every `game:state-update` event in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T019)
- [ ] T055 [US6] Handle player quit: mark as "Quit" status on leaderboard, freeze score, remove fish from world in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T056 [P] [US6] Update leaderboard component to subscribe to state and render rankings in real-time in [src/client/game/components/leaderboard.ts](src/client/game/components/leaderboard.ts) (extend T025)
- [ ] T057 [US6] Display leader indicator (crown icon) next to lobby leader in leaderboard in [src/client/game/components/leaderboard.ts](src/client/game/components/leaderboard.ts) (extend T056)

## Phase 9: User Story 7 - Game Pause & Resume (Priority: P2)

**Goal**: Only leader can pause; timer/movement freeze; other players see quit option; power-up timer pauses.
**Manual Verification**: As leader press pause (button appears, non-leader grayed out), verify timer stops and fish freeze, observe "Game Paused by [Leader]" overlay, as leader resume game, verify timer/fish resume, non-leader sees quit-only option while paused.

### Implementation

- [ ] T058 [US7] Implement pause state in server game session in [src/server/game/state.ts](src/server/game/state.ts) (extend T002)
- [ ] T059 [P] [US7] Add pause button to game HUD (leader-only visibility) in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T007)
- [ ] T060 [US7] Handle `game:pause-toggle` event on server, validate leader, freeze state in [src/server/game/controller.ts](src/server/game/controller.ts) (extend T009)
- [ ] T061 [P] [US7] Emit `game:paused` and `game:resumed` events, broadcast pause state in `game:state-update` in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T062 [US7] Stop power-up timer expiration while paused in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T050)
- [ ] T063 [P] [US7] Show pause overlay on client when game paused in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T007)
- [ ] T064 [US7] Disable non-leader pause button and show quit-only option while paused in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T063)

## Phase 10: User Story 8 - Game End & Results Screen (Priority: P1)

**Goal**: On timer end, display results with leaderboard, winner, and navigation to lobby/new game.
**Manual Verification**: Play until 0:00, results screen shows winner, final leaderboard, "Return to Lobby" and "New Game" buttons work.

### Implementation

- [ ] T065 [US8] Render results overlay with winner info and final leaderboard in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T026)
- [ ] T066 [P] [US8] Implement "Return to Lobby" button to navigate back to lobby scene in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T065)
- [ ] T067 [P] [US8] Implement "New Game" button to restart game flow (return to lobby for new session) in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T066)

## Phase 11: User Story 9 - Sidebar UI & Real-time Information (Priority: P2)

**Goal**: Sidebar displays score, Fish-O-Meter (growth phase + XP progress), leaderboard, help button, pause/quit controls.
**Manual Verification**: Launch game, verify sidebar shows score updating, Fish-O-Meter filling, leaderboard updating, help button opens, pause visible to leader only, quit available to all.

### Implementation

- [ ] T068 [P] [US9] Create sidebar layout component in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts)
- [ ] T069 [P] [US9] Implement score display updating in real-time in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T068)
- [ ] T070 [US9] Wire Fish-O-Meter to sidebar in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T033)
- [ ] T071 [US9] Wire leaderboard to sidebar in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T056)
- [ ] T072 [P] [US9] Add help button to sidebar, open rules modal (populate with spec excerpts) in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T068)
- [ ] T073 [P] [US9] Add pause button to sidebar (leader-only, wired to pause-toggle) in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T068)
- [ ] T074 [P] [US9] Add quit button to sidebar (all players, emits `game:player-quit`) in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T068)

## Phase 12: Rendering & Visual Polish

- [ ] T075 [P] Create decorative entities (Bubble, Rock, Seaweed) in [src/client/game/entities/](src/client/game/entities/)
- [ ] T076 [P] Build decal renderer manager for visual-only decorations in [src/client/game/managers/decal-renderer.ts](src/client/game/managers/decal-renderer.ts)
- [ ] T077 Add game canvas background gradient (#B4C3B5 to #49534A) and black border in [src/client/game/components/game-scene.ts](src/client/game/components/game-scene.ts) (extend T005)
- [ ] T078 [P] Render sand, rocks, seaweed on bottom edge of game world in decorative manager in [src/client/game/managers/decal-renderer.ts](src/client/game/managers/decal-renderer.ts) (extend T076)
- [ ] T079 [P] Apply pixelated font to all game UI text (timer, leaderboard, sidebar, overlays) in [src/client/styles/game.css](src/client/styles/game.css) (create file)
- [ ] T080 [P] Style timer display (upper-left corner, format MM:SS:ms, black text) in [src/client/game/components/game-hud.ts](src/client/game/components/game-hud.ts) (extend T021)
- [ ] T081 [P] Style sidebar with #ADC8AF background, black border, oblong shape in [src/client/game/components/sidebar.ts](src/client/game/components/sidebar.ts) (extend T068)
- [ ] T082 Implement fish animation (wiggle, drag effect, direction indicator) in [src/client/game/entities/fish.ts](src/client/game/entities/fish.ts) (extend T016)

## Phase 13: Network & Polish

- [ ] T083 [P] Implement client-side prediction with input queue and reconciliation on state mismatch in [src/client/game/physics.ts](src/client/game/physics.ts) (extend T014)
- [ ] T084 [P] Implement entity interpolation (lerp between two states) for smooth NPC/hostile movement in [src/client/game/physics.ts](src/client/game/physics.ts) (extend T083)
- [ ] T085 Handle graceful disconnect: remove player fish, mark "Quit" on leaderboard, cleanup socket listeners in [src/server/game/controller.ts](src/server/game/controller.ts) (extend T009)
- [ ] T086 [P] Implement client reconnection flow (30s grace period for rejoin) in [src/client/game/scene-controller.ts](src/client/game/scene-controller.ts) (extend T006)
- [ ] T087 Verify all Socket.IO events include serverTick counter for synchronization in [src/server/game/loop.ts](src/server/game/loop.ts) (extend T008)
- [ ] T088 [P] Add error handling for invalid game state, malformed inputs, and network errors in [src/server/game/controller.ts](src/server/game/controller.ts) (extend T009)

## Phase 14: Manual Validation & Documentation

- [ ] T089 Execute Flow 1 (Core Loop) manual validation from quickstart in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T090 Execute Flow 2 (Growth) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T091 Execute Flow 3 (NPC Spawning) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T092 Execute Flow 4 (Respawn) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T093 Execute Flow 5 (Power-ups) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T094 Execute Flow 6 (Leaderboard) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T095 Execute Flow 7 (Pause) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T096 Execute Flow 8 (Game End) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)
- [ ] T097 Execute Flow 9 (Sidebar) manual validation in [specs/002-active-game/quickstart.md](specs/002-active-game/quickstart.md)

## Dependencies (Story Order & Completion)

**Critical Path** (MVP):
1. **US1** (Core Loop) → US2 (Growth) → US3 (NPC Spawning) → US8 (Game End)
   - Must complete before US4, US5, US6, US7, US9 can be verified

**Secondary Path** (Enhancement):
2. **US4** (Respawn) — depends on US1 core loop
3. **US5** (Power-ups) — depends on US1 core loop
4. **US6** (Leaderboard) — depends on US1 core loop
5. **US7** (Pause) — depends on US1 core loop (leader control)
6. **US9** (Sidebar) — depends on all stories (integrates all features)

**Validation Path**:
7. Manual validation flows T089–T097 depend on all stories complete

## Parallel Execution Examples

**Phase 2 Foundation** (4 parallel workers):
- Worker 1: T008 (server loop), T019 (state broadcast)
- Worker 2: T009 (controller), T010 (orchestrator)
- Worker 3: T012 (client input), T013 (client engine)
- Worker 4: T011 (collision), T014 (client physics)

**Phase 3 US1 Core Loop** (3 parallel workers):
- Worker 1: T015 (visual entity), T016 (fish entity), T017 (player renderer)
- Worker 2: T022 (NPC entity), T023 (NPC spawner), T034 (NPC AI)
- Worker 3: T018 (init session), T020 (state subscription), T024 (eating collision)

**Phase 5–7 US2–US5** (Independent enhancements):
- T028–T033 (Growth) parallel with T044–T052 (Power-ups)
- T048 (Speed Boost) parallel with T049 (Double XP)
- T038 (Respawn state) parallel with T046 (Powerup spawner)

**Phase 12 Rendering** (All visual tasks parallel):
- T075–T082 (Decorations, fonts, styling, animations) all independent

## Implementation Strategy

**MVP Scope (Complete by end of Phase 11):**
1. Phase 1–3: Setup + US1 Core Loop (T001–T027)
   - Minimum: players move, eat NPCs, score updates, timer ends → results
   - Validation: Flow 1 complete

2. Phase 4–5: US2 Growth + US3 NPC Spawning (T028–T037)
   - Adds progression feedback and enemy variety
   - Validation: Flows 2–3 complete

3. Phase 6: US4 Respawn (T038–T043)
   - Adds fairness and recovery mechanic
   - Validation: Flow 4 complete

**Post-MVP Enhancements (Phase 7–11):**
4. US5 Power-ups (T044–T052) → Flow 5
5. US6 Leaderboard (T053–T057) → Flow 6
6. US7 Pause (T058–T064) → Flow 7
7. US8 Game End (T065–T067) → Flow 8
8. US9 Sidebar UI (T068–T074) → Flow 9

**Polish (Phase 12–14):**
- Rendering (T075–T082)
- Network polish (T083–T088)
- Manual validation (T089–T097)

**Delivery Points:**
- **Milestone 1** (after Phase 3): Core loop playable, 1-player game works
- **Milestone 2** (after Phase 5): Progression visible, NPC variety, multiplayer ready
- **Milestone 3** (after Phase 7): Fair respawn, balanced gameplay
- **Milestone 4** (after Phase 11): Full feature set, all stories complete
- **Milestone 5** (after Phase 14): Polish, optimization, manual validation passed

