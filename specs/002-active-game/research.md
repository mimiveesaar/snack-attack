# Research: Snack Attack Active Game Mechanics

## 1) XP Thresholds for Growth Phases

- **Decision**: Growth Phase 1 → Phase 2 at 50 XP; Phase 2 → Phase 3 at 150 XP
- **Rationale**: 
  - 50 XP is achievable after eating ~5 Pink NPCs (10 XP each), providing early progression feedback within ~10-15s of gameplay
  - 150 XP represents ~50% of a typical 2-minute game, making Phase 3 a significant achievement
  - Gap of 100 XP between phases provides meaningful progression without feeling grindy
  - Playable in 2-minute game: realistically achievable in multiplayer (1-2 min to Phase 2, 1.5-2 min to Phase 3)
- **Alternatives considered**: 
  - 25/75 (too fast progression, less satisfying growth feeling)
  - 100/250 (too slow, players never reach Phase 3 in 2-min game)
  - 50/100 (narrower gap, less meaningful distinction between phases)

## 2) NPC Spawn Frequency & Concurrency

- **Decision**: 
  - Pink: max 5 concurrent, spawn 1 every 1.5s average
  - Grey: max 3 concurrent, spawn 1 every 4s average
  - Brown: max 1 concurrent, spawn 1 every 8s average
- **Rationale**:
  - Frequency ensures steady food supply for players without overcrowding
  - 1.5s for Pink allows constant availability; 4s for Grey makes them targets; 8s for Brown makes them rare prizes
  - Concurrency caps prevent world overflow while maintaining variety (approx 9 NPCs max = manageable for 500×500 canvas)
  - Ratios (Pink 60%, Grey 30%, Brown 10%) result in frequency distribution matching player observation preferences
- **Alternatives considered**:
  - Fixed spawn rate (ignores cap, can overpopulate)
  - Dynamic spawn based on player count (adds complexity; fixed simpler for MVP)
  - Wave-based spawning (feels artificial; continuous better for agar.io-like feel)

## 3) Power-up Spawn Strategy

- **Decision**: 
  - One power-up active at a time; new power-up spawns every 15s (or when current is collected/despawns)
  - Type: Random 50/50 Speed Boost vs Double XP
  - Location: Random position, re-rolled if within 75px of any player fish
  - Duration: 10s once collected
  - No spawn during pause
- **Rationale**:
  - 15s frequency balances game agency (can impact 25% of 2-min game) without over-rewarding
  - 50/50 split gives equal chance to defensive (speed) and offensive (XP) strategies
  - 75px safety ensures players don't instantly collect on spawn; encourages movement decision
  - 10s duration provides noticeable boost window (25% of mid-game) without dominance
- **Alternatives considered**:
  - Multiple simultaneous power-ups (too chaotic, harder to balance)
  - Spawn on NPC death (couples spawn to eating, less predictable)
  - Fixed location (predictable, reduces discovery)

## 4) Respawn Mechanics Detail

- **Decision**:
  - Respawn delay: 2 seconds after eating
  - Grace period: 2 seconds after respawn (cannot be eaten)
  - Respawn location: Random position with 50px minimum safe distance from any player
  - XP on respawn: Reset to 0 (base XP)
  - Size on respawn: Phase 1 (base size)
- **Rationale**:
  - 2s respawn delay prevents instant re-entry; gives other players time to regain focus
  - 2s grace period prevents death-loop frustration; fair enough to escape initial predators
  - 50px safety ensures no immediate re-eating; reasonable for 500×500 canvas (10% of width)
  - Full XP reset maintains high-stakes gameplay; losing progress is punishment
  - Respawn is deterministic and handled server-side for anti-cheat
- **Alternatives considered**:
  - Instant respawn (too forgiving, death meaningless)
  - 5s grace period (too safe, kills prediction gameplay)
  - Partial XP retention (confuses eating rules, harder to balance)

## 5) Collision Resolution Ordering

- **Decision**: Deterministic ordering by joinOrder (order of joining lobby). In each server tick, if multiple collisions can occur, process them in joinOrder sequence: player 1, player 2, etc.
- **Rationale**:
  - Stable, reproducible resolution prevents client disagreements
  - joinOrder is persistent per game session and known to all clients
  - Prevents scenarios where simultaneous eating results in different outcomes
  - Server-authoritative; clients cannot predict eating order
- **Alternatives considered**:
  - Simultaneous resolution (ambiguous, clients may disagree)
  - Random ordering (non-deterministic, hard to debug/explain)
  - XP-based priority (incentivizes specific playstyle, unfair handicap)

## 6) Server Tick Rate & Broadcast Frequency

- **Decision**:
  - Server tick rate: 60 Hz (16.67ms per tick, fixed timestep)
  - State broadcast frequency: 10 Hz (send `game:state-update` every 6 ticks = every 100ms)
  - Client render frequency: ~60 FPS (requestAnimationFrame, variable but typically 60 FPS)
- **Rationale**:
  - 60 Hz server tick provides smooth collision detection and deterministic physics
  - 10 Hz broadcast balances network overhead vs. perceived smoothness; 100ms = acceptable latency for 1-4 players
  - 6x difference (60 server / 10 broadcast) ensures collision resolution completes before next broadcast
  - Client interpolation fills gaps between broadcasts
- **Alternatives considered**:
  - 30 Hz server (too slow for reliable collisions; feel sluggish)
  - 20 Hz broadcast (too chatty; network overhead)
  - 1 Hz broadcast (too sparse; jittery movement, lag compensation fails)

## 7) Client-Side Prediction & Reconciliation

- **Decision**:
  - Client predicts own player movement based on held keys and deltaTime
  - Client sends input vector {x, y} and timestamp to server every client tick
  - Server computes authoritative position, collision, and eating
  - If server position differs by >5px from client prediction, client rewinds, reapplies unacknowledged inputs, and resumes from server state
  - Grace period: player has ~100-200ms to see correction before snap
- **Rationale**:
  - Prediction makes movement feel instant (no network round-trip delay)
  - Reconciliation prevents client from desyncing or cheating
  - 5px threshold allows for minor network jitter without correction
  - Rewind + replay ensures deterministic state without player confusion
- **Alternatives considered**:
  - Server-authoritative only (30-100ms latency; movement feels sluggish)
  - Client authoritative (cheat-prone; other players may see different positions)
  - Extrapolation without correction (diverges over time; eventual desync)

## 8) Visual vs. Gameplay Collision Separation

- **Decision**:
  - **Client-side visual-only collisions**: Bubble sparkles, seaweed sway, rock wobble on contact—purely aesthetic
  - **Server-side gameplay collisions**: Fish eating, power-up pickup, boundary checks—affect score/state
  - Clear boundary: if collision affects score or game outcome, it lives on server
- **Rationale**:
  - Simplifies architecture: client renders, server rules
  - Prevents cheating: client cannot fake eating or power-up gain
  - Allows cosmetic flexibility: client can add visual feedback without desync risk
  - Matches agar.io-like game design: server is authority, client is view
- **Alternatives considered**:
  - All collisions client-side (cheat vector; complexity in client)
  - All collisions server-side (adds latency to visual feedback; less responsive)

## 9) Player Disconnect Handling

- **Decision**:
  - On socket disconnect: mark player as "Quit" in leaderboard immediately
  - Player fish removed from world on next server tick
  - Score frozen; player excluded from winning
  - Grace period: 30 seconds to rejoin with same player ID (for future re-join-in-progress feature)
  - After grace period: player slot removed from game
- **Rationale**:
  - Immediate "Quit" marking provides feedback to other players
  - 30s grace period allows for brief network hiccup recovery
  - Player fish removal prevents orphaned entities on other clients
  - Exclusion from winning prevents AFK farming
- **Alternatives considered**:
  - Instant permanent removal (harsh on brief disconnects)
  - Spectator mode (scope creep; not in spec)
  - AI takeover (complex, not requested)

## 10) Pause Implementation & Leader-Only Control

- **Decision**:
  - Only lobby leader can pause; button disabled for other players
  - On pause: timer stops, all movement freezes, overlay shows "Game Paused by [Leader Name]"
  - Power-up duration timer does not tick down while paused
  - Only leader can resume; other players see quit option only
  - Pause can be toggled at any time (no restrictions)
- **Rationale**:
  - Single pause authority (leader) prevents chaos from conflicting requests
  - Freezing all state ensures no collision resolution during pause
  - Power-up pause prevents abuse (e.g., pause to delay power-up expiration)
  - Leader resume preserves control and prevents game from accidentally resuming
- **Alternatives considered**:
  - Democratic vote to pause (complexity; rare use case)
  - Any player can pause (chaos; conflict risk)
  - Auto-resume after 30s (frustrating; defeats pause purpose)
