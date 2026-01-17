# Data Model: Snack Attack Active Game Mechanics

## Entities

### GameSession
Represents an active game instance tied to a lobby.
- **sessionId**: string (UUID; unique per game)
- **lobbyId**: string (parent lobby reference)
- **createdAt**: number (Unix timestamp in ms)
- **startedAt**: number (Unix timestamp in ms; when game actually began)
- **status**: enum { active, paused, ended }
- **timerStartMs**: number (server time when timer was started; used for consistent countdown)
- **isPaused**: boolean
- **pausedByLeaderId**: string | null (leader who initiated pause)
- **players**: Player[] (participants; ordered by joinOrder from lobby)
- **npcs**: NPC[] (non-player fish in world)
- **powerups**: PowerUp[] (active power-ups)
- **serverTick**: number (current tick counter, increments every 16.67ms)
- **leaderboard**: LeaderboardEntry[] (current rankings by XP)

### Player (Game Context)
Extends lobby Player with game state; tied to a game session.
- **id**: string (inherited from lobby; stable across game)
- **nicknameDisplay**: string (inherited from lobby)
- **color**: string (inherited from lobby; determines fish color)
- **isLeader**: boolean (inherited from lobby; can pause)
- **position**: Vec2D { x: number, y: number } (0-500 range)
- **velocity**: Vec2D { vx: number, vy: number } (pixels per second)
- **xp**: number (current XP; 0 = base, 50+ = phase 2, 150+ = phase 3)
- **growthPhase**: number (1, 2, or 3; determined by XP thresholds)
- **collisionRadius**: number (pixels; scales with growth: phase 1 = 12px, phase 2 = 18px, phase 3 = 24px)
- **visualSize**: number (scale multiplier; phase 1 = 1.0, phase 2 = 1.5, phase 3 = 2.0)
- **status**: enum { alive, respawning, spectating }
- **respawnTimeMs**: number | null (Unix timestamp when respawn completes; null if alive)
- **graceEndTimeMs**: number | null (Unix timestamp when grace period ends; null if no grace)
- **powerups**: PowerupType[] (active power-ups: 'speed-boost' | 'double-xp')
- **powerupEndTimes**: Map<PowerupType, number> (Unix timestamp each power-up expires)
- **lastInputTick**: number (last tick when player sent input)
- **inputQueue**: PlayerInput[] (unacknowledged inputs for reconciliation)

### NPC (Non-Player Character Fish)
Represents a passive NPC fish entity.
- **id**: string (UUID; unique per session)
- **type**: enum { pink, grey, brown }
- **xp**: number (fixed: pink=10, grey=25, brown=50)
- **position**: Vec2D { x, y }
- **velocity**: Vec2D { vx, vy } (small, passive loitering motion)
- **collisionRadius**: number (fixed per type: pink=10px, grey=14px, brown=18px)
- **visualSize**: number (fixed per type)
- **status**: enum { spawning, alive, despawning }
- **spawnTimeMs**: number (when NPC entered world)

### PowerUp
Represents a collectible power-up entity in the world.
- **id**: string (UUID)
- **type**: enum { 'speed-boost' | 'double-xp' }
- **position**: Vec2D { x, y }
- **collisionRadius**: number (14px)
- **spawnTimeMs**: number (Unix timestamp)
- **status**: enum { spawning, available, collected, despawning }
- **collectedByPlayerId**: string | null (if collected, which player)

### PlayerInput
Represents input sent by client in a tick.
- **playerId**: string
- **direction**: Vec2D { x: -1|0|1, y: -1|0|1 } (keyboard state)
- **speed**: number (magnitude; 1.0 normal, 1.2 if speed-boost active)
- **timestamp**: number (client-reported Unix time in ms)
- **tick**: number (server tick number when received)
- **acknowledged**: boolean (has server confirmed this input applied?)

### CollisionEvent
Represents a resolved collision that occurred in a tick.
- **type**: enum { eating, powerup-collected, boundary-hit, grace-period-blocked }
- **tick**: number (server tick when collision occurred)
- **subject**: { playerId: string } | { npcId: string }
- **object**: { playerId: string } | { npcId: string } | { powerId: string } | null
- **data**: {
    - xpTransferred?: number (if eating)
    - powerupType?: PowerupType (if power-up collected)
    - newXp?: number (subject's XP after event)
  }

### LeaderboardEntry
Snapshot of a player's current standing.
- **playerId**: string
- **nicknameDisplay**: string
- **rank**: number (1 = highest XP)
- **xp**: number
- **status**: enum { active, respawning, spectating, quit }
- **isLeader**: boolean

### Vec2D
Simple 2D vector.
- **x**: number
- **y**: number

### PowerupType
- 'speed-boost' | 'double-xp'

## Relationships

- GameSession has many Players (1..4)
- GameSession has many NPCs (0..9; max 5 pink + 3 grey + 1 brown)
- GameSession has 0..1 PowerUp active at a time
- Player lives in GameSession and has many CollisionEvents
- NPC lives in GameSession and has many CollisionEvents
- LeaderboardEntry references a Player within a GameSession

## Validation Rules

### Position & Boundaries
- All entities must have position.x ∈ [0, 500] and position.y ∈ [0, 500]
- Velocity vectors clamped to max magnitude (e.g., max speed = 300 px/s for players, 80 px/s for NPCs)
- On collision with boundary, position snapped to boundary and velocity component zeroed

### XP & Growth
- Player XP ≥ 0; no upper cap
- Growth phase determined by XP: 0-49 = phase 1, 50-149 = phase 2, 150+ = phase 3
- Collision radius and visual size computed from growth phase (fixed mapping)
- On eating: xp_gained = eaten_fish.xp * (double-xp-active ? 2 : 1)

### Eating Rules
- Fish A can eat Fish B if XP(A) > XP(B)
- If XP(A) == XP(B), neither eats (collision without effect)
- If B is in grace period, collision has no effect (B not eaten)
- Server resolves collisions in joinOrder; first eligible eat removes that fish

### Respawn
- Player respawn delay: 2000ms after eaten
- Grace period: 2000ms after respawn (cannot be eaten)
- Respawn position: random with 50px min safe distance from other players
- Respawn state: XP=0, phase=1, velocity={0,0}, status=alive

### Power-ups
- Max 1 active power-up in world at a time
- Duration: 10000ms (10 seconds) once collected
- Spawn location: random with 75px min safe distance from any player
- Frequency: spawn every 15000ms (or on collection)
- On player eaten: all active power-ups lost
- Pause state: power-up duration timer does not tick while isPaused=true

### NPC Spawning
- Pink max concurrent: 5
- Grey max concurrent: 3
- Brown max concurrent: 1
- Total NPC cap: 9
- Spawn frequency: Pink every 1500ms average, Grey every 4000ms, Brown every 8000ms
- Spawn location: random with 50px min safe distance from any player
- Spawn frequency scales inversely with current count (if 5 pink exist, stop spawning pink until one eaten)

### State Transitions
- Entity status: spawning → alive → [despawning if eaten] → destroyed
- Player status: alive ↔ respawning (on eaten: alive→respawning; after respawn delay: respawning→alive)
- GameSession status: active ↔ paused (on leader pause: active→paused; on leader resume: paused→active)
- On timer end: all players → spectating; GameSession → ended

## Assumptions

- Server tick rate is fixed at 60 Hz (16.67ms per tick)
- Network round-trip latency is typically 30-100ms for local testing, up to 300ms for remote
- Deterministic collision resolution is adequate (ties broken by joinOrder, not randomness)
- XP thresholds are production-tuned based on playtesting (currently 50 and 150)
- All XP values are integers; fractional XP not supported (simplifies math)
- Collision radius is circular; no pixel-perfect polygon collision (simplifies physics)
- respawnTimeMs and graceEndTimeMs are Unix timestamps (server-authoritative time)
