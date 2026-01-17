# Quickstart: Snack Attack Active Game Mechanics

## Prerequisites
- Node.js (current LTS) with pnpm
- Two browser windows or tabs (for testing multiplayer)
- Completed lobby system (001-lobby-system branch)

## Setup

### 1) Install dependencies
```bash
pnpm install
```

### 2) Run dev servers
```bash
# Terminal 1: Start socket.io server (includes /lobby and /game namespaces)
pnpm run dev:server

# Terminal 2: Start Vite client dev server
pnpm run dev:client
```

### 3) Navigate to game
- Open http://localhost:5173 in two separate browser windows
- Create or join a lobby in both windows
- Leader clicks "Start Game" to initiate game session
- Both clients should transition to game scene with fixed 500×500 canvas

## Manual Validation Flows

### Flow 1: Core Gameplay Loop (US1)
**Goal**: Verify game starts, players can move, NPCs spawn, and collisions work.

1. Start a 1-player game (create lobby with singleplayer mode)
2. **Verify**: Game scene renders with timer showing ~2:00, player fish visible in center, NPCs spawning
3. **Control player**: Use arrow keys to move; fish should respond with smooth client-side prediction
4. **Encounter NPC**: Move toward a Pink NPC; on collision, NPC should disappear and your score increase
5. **Verify**: Leaderboard updates in real-time with new score
6. **Wait**: Watch timer count down; after 2:00, game should end with results screen
7. **Verify**: Results screen shows final leaderboard and "Return to Lobby" / "New Game" buttons

**Success Criteria**:
- [ ] Game scene loads within 2s of "Start" click
- [ ] Timer counts down accurately (within 50ms drift)
- [ ] Player movement is smooth and responsive (no visible lag)
- [ ] NPCs appear within 5s and move passively
- [ ] Eating an NPC updates score and removes NPC
- [ ] Game ends exactly at 0:00 with results screen

---

### Flow 2: Fish Growth & XP (US2)
**Goal**: Verify XP tracking, growth phases, and collision radius changes.

1. Start a 1-player singleplayer game
2. **Collect NPCs**: Eat Pink NPCs (~5) to reach 50 XP
3. **Verify at 50 XP**: 
   - Fish size visually increases on screen
   - Collision radius expands (harder to fit between obstacles)
   - Leaderboard shows score changing
4. **Continue eating**: Aim for 150+ XP
5. **Verify at 150 XP**:
   - Fish size increases again (noticeably larger than phase 2)
   - Can now eat Grey NPCs (medium difficulty)
   - Score reflects phase 3 status
6. **Challenge**: Try to eat a Brown NPC with phase 2 vs. phase 3
   - Phase 2: collision has no effect (cannot eat)
   - Phase 3: collision eats Brown NPC (XP gained)

**Success Criteria**:
- [ ] Growth phase 2 triggers at exactly 50 XP
- [ ] Growth phase 3 triggers at exactly 150 XP
- [ ] Fish size visibly changes at each phase
- [ ] Collision radius changes match size (measured by NPC collision behavior)
- [ ] XP-based eating rules enforced (phase 2 cannot eat Grey/Brown)

---

### Flow 3: NPC Spawning & Frequency (US3)
**Goal**: Verify NPC types spawn with correct frequency ratios.

1. Start a 1-player game; do NOT eat any NPCs
2. **Observe NPCs for 30 seconds**:
   - Count number of each type: Pink (small), Grey (medium), Brown (large)
   - Track approximate spawn times
3. **Verify frequency ratios**:
   - Pink: most frequent (60% of spawns)
   - Grey: medium frequency (30% of spawns)
   - Brown: rarest (10% of spawns)
4. **Verify NPC counts**:
   - Total active NPCs stay in reasonable range (~3-7)
   - Max Pink visible: ~5, Max Grey: ~3, Max Brown: ~1
5. **Verify spawn safety**:
   - NPCs never spawn directly on player fish
   - Minimum 50px distance maintained from player

**Success Criteria**:
- [ ] Over 30s, Pink spawns 2-3x more than Grey
- [ ] Over 30s, Grey spawns 3-5x more than Brown
- [ ] No NPC spawns within 50px of player fish
- [ ] Max concurrent NPCs stays below 10
- [ ] NPC movement is passive (no chasing toward player)

---

### Flow 4: Player Respawn & Grace Period (US4)
**Goal**: Verify respawn delay, grace period, and position safety.

1. Start a 1-player multiplayer game (or join with 2 players)
2. **Get eaten**: Move toward an NPC with higher XP and collide
3. **Verify respawn screen**:
   - Fish disappears immediately
   - Respawn screen shows ~2s countdown
   - Other players see you as "Respawning" in leaderboard
4. **Respawn completion**:
   - Fish reappears at random location (not at previous position)
   - XP resets to 0, size returns to phase 1
   - Score in leaderboard resets
5. **Grace period test**:
   - Stay still for ~1s after respawn
   - Nearest NPC should not eat you (grace period active)
   - After 2s, NPCs can eat you again (confirm by moving into one)

**Success Criteria**:
- [ ] Respawn delay is 2 ± 0.2s
- [ ] Respawn position is >50px from other players
- [ ] XP resets to 0 on respawn
- [ ] Grace period prevents eating for 2s
- [ ] Grace period ends at 2 ± 0.2s after respawn

---

### Flow 5: Power-ups & Temporary Effects (US5)
**Goal**: Verify power-up spawning, collection, and duration.

1. Start a 1-player game
2. **Wait for power-up**: Monitor canvas for ~15s until power-up icon appears
3. **Collect power-up**:
   - Move fish to power-up icon
   - On collision, icon disappears; effect activates
4. **Test Speed Boost** (if collected):
   - Movement should noticeably accelerate (1.2x speed)
   - Movement remains accurate and smooth
   - After 10s, movement returns to normal speed
5. **Test Double XP** (if collected):
   - When you eat an NPC, XP gain is doubled
   - Eat one Pink NPC: should gain 20 XP (instead of 10)
   - After 10s, XP gain returns to normal
6. **Power-up + Respawn**:
   - Activate a power-up
   - Get eaten and respawn
   - Verify power-up effect is lost (buff clears on respawn)

**Success Criteria**:
- [ ] Power-up spawns every ~15s
- [ ] Speed Boost increases movement by ~1.2x
- [ ] Double XP effect doubles XP gain from eaten fish
- [ ] Each effect lasts exactly 10 ± 0.5s
- [ ] Power-up lost on player death
- [ ] Only one power-up active at a time

---

### Flow 6: Leaderboard & Live Scoring (US6)
**Goal**: Verify real-time leaderboard updates and player rankings.

1. Start a 2-player multiplayer game (2 browser tabs)
2. **Monitor leaderboard**:
   - Both players listed with starting score 0
   - Leader indicator shows who can pause
3. **Player 1 eats NPCs**: Score increases in real-time on leaderboard
4. **Player 2 watches**: Leaderboard updates immediately (within 200ms)
5. **Verify rankings**: Highest score appears at top of list
6. **Test quit**:
   - Player 2 clicks "Quit" button
   - Leaderboard shows "Player 2 - Quit" with final score frozen
   - Player 1 remains active and can continue
7. **Game end**: Leaderboard reflects final rankings on results screen

**Success Criteria**:
- [ ] Leaderboard updates within 200ms of score change
- [ ] Ranking order updates correctly as scores change
- [ ] Leader indicator shown next to leader name
- [ ] Quit player remains visible with "Quit" status
- [ ] Results screen shows final leaderboard with winner

---

### Flow 7: Game Pause & Resume (US7)
**Goal**: Verify leader-only pause control and state freeze.

1. Start a 1-player multiplayer game with 2 players
2. **Leader pauses**: Player 1 (leader) clicks Pause button
3. **Verify pause state**:
   - Game overlay shows "Game Paused by [Leader Name]"
   - Timer freezes (stops counting down)
   - Fish freeze in place (no movement)
   - Active power-up timer does NOT tick down
4. **Non-leader controls**:
   - Player 2 sees Pause button DISABLED
   - Player 2 only has "Quit" option
5. **Leader resumes**: Player 1 clicks Resume button
6. **Verify resume state**:
   - Overlay disappears
   - Timer resumes from where it paused
   - Fish can move again
   - Power-up timer resumes ticking

**Success Criteria**:
- [ ] Leader can toggle pause at any time
- [ ] Non-leader cannot pause (button disabled)
- [ ] Timer pauses and resumes correctly
- [ ] Fish movement freezes when paused
- [ ] Power-up timer pauses and resumes
- [ ] Pause overlay displays leader name

---

### Flow 8: Game End & Results (US8)
**Goal**: Verify game ending and results display.

1. Start a 1-player game
2. **Play until timer reaches 0:00**
3. **Verify results screen**:
   - "Game Finished" header or "Finished!" message
   - Final leaderboard with all players and scores
   - Winner highlighted (player with highest XP)
   - Buttons: "Return to Lobby" and "New Game"
4. **Return to Lobby**: Click button; should navigate back to lobby with player list
5. **Results persistence**: Final scores reflected in leaderboard until new game starts

**Success Criteria**:
- [ ] Game ends at exactly 0:00
- [ ] Results screen displays within 500ms
- [ ] Leaderboard shows final scores and rankings
- [ ] Winner is clearly identified
- [ ] Navigation buttons work correctly
- [ ] Returning to lobby does not cause errors

---

### Flow 9: Sidebar UI & HUD (US9)
**Goal**: Verify sidebar information display and controls.

1. Start a 1-player game
2. **Verify sidebar is visible** on right side of game canvas
3. **Check Score display**:
   - Shows "Score: X" where X updates in real-time
   - Updates when you eat NPCs
4. **Check Fish-o-Meter**:
   - Shows 3 colored fish (Pink, Grey, Brown) representing eating capability
   - Progress bar below indicates XP progress to next phase
   - Bar fills as you accumulate XP
   - Phases marked on bar
5. **Check Help button**:
   - Located in top-left of sidebar
   - Click to open rules/help screen
   - Can close help without disrupting game
6. **Check Pause button** (leader only):
   - Visible only to lobby leader
   - Click toggles pause state
7. **Check Quit button** (all players):
   - Visible to all players
   - Click removes you from game

**Success Criteria**:
- [ ] Sidebar visible and positioned correctly
- [ ] Score updates in real-time
- [ ] Fish-o-Meter reflects current XP and growth phase
- [ ] Progress bar filled proportionally to next phase
- [ ] Help button opens and closes without issues
- [ ] Pause button only visible to leader
- [ ] Quit button visible to all players

---

## Debugging Tips

### Game won't start
- Check `/game` namespace is wired in server (see `src/server/index.ts`)
- Verify Socket.IO client connects (check browser console for warnings)
- Check player IDs match between lobby and game (session association)

### Jittery movement
- Check network latency (open DevTools Network tab)
- Verify client-side prediction is enabled (see `src/client/game/engine.ts`)
- Check server tick rate is 60 Hz (look for "Tick: X" in server logs)

### Collisions not working
- Verify collision detection runs server-side (see `src/server/game/loop.ts`)
- Check NPC/Player positions are in [0, 500] range
- Monitor collision resolution order (should be deterministic by joinOrder)

### Leaderboard not updating
- Check `game:state-update` events are broadcast at 10 Hz
- Verify leaderboard is included in state update payload
- Monitor network tab for event frequency

---

## Performance Targets

- Game scene load: <3s
- Movement latency: <100ms perceived (client-side prediction masks network)
- Leaderboard update: <200ms
- NPC spawn detection: <500ms
- Game end to results: <500ms

If experiencing higher latencies, check:
- Server CPU usage (tick loop should not exceed 50% on modern hardware for 1-4 players)
- Client frame rate (should sustain ~60 FPS; check DevTools Performance tab)
- Network conditions (test with throttling in DevTools)
