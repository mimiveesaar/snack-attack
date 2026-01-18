# Snack Attack - Game Logic Overview

## Architecture

The game uses a **60 Hz server-authoritative game loop** that runs on the server and broadcasts state updates to clients at 10 Hz.

```
Server (60 Hz tick) → State Updates (10 Hz broadcast) → Client Rendering
```

---

## Core Game Loop (`server/game/loop.ts`)

The game loop runs every ~16.67ms (60 FPS) and processes:

### Tick Flow:
1. **Increment server tick counter**
2. **Update timer** - countdown the game duration
3. **Update players** - apply movement based on input
4. **Update NPCs** - move NPCs, spawn new ones
5. **Update power-ups** - handle spawning/expiration
6. **Process collisions** - check eating, boundaries, powerups
7. **Broadcast state** - every 6 ticks (10 Hz), send state to clients
8. **Broadcast timer** - every 60 ticks (1 Hz), send timer update

### Constants:
- **TICK_RATE_HZ**: 60 (ticks per second)
- **TICK_INTERVAL_MS**: 16.67ms
- **BROADCAST_RATE_HZ**: 10 (state updates per second)
- **BROADCAST_INTERVAL_TICKS**: 6 (every 6 ticks = ~100ms)

---

## Game State (`server/game/state.ts`)

The `GameSessionState` class manages the authoritative game state.

### GameState Structure:
```typescript
{
  sessionId: string              // Unique game session ID
  lobbyId: string                // Associated lobby
  status: 'active' | 'paused' | 'ended'
  serverTick: number             // Current tick number
  timerStartMs: number           // When game started
  gameTimerDurationMs: number    // 2 minutes = 120,000ms
  
  players: GamePlayer[]          // 1-8 players
  npcs: GameNPC[]               // Spawned enemy fish
  powerups: GamePowerUp[]        // Speed boosts, double XP
  leaderboard: GameLeaderboardEntry[]
}
```

### Key Methods:
- **applyPlayerInput(playerId, direction)** - Set player velocity based on input
- **updatePlayerXp(playerId, delta)** - Add XP, update growth phase
- **setPlayerRespawning(playerId, delayMs)** - Mark player as respawning
- **completePlayerRespawn(playerId, position)** - Respawn with grace period
- **updateLeaderboard()** - Recalculate rankings

---

## Player Movement & Input (`server/game/controller.ts`)

### Player Input Flow:
1. **Client** sends `game:player-input` event every frame with direction
2. **GameController.handlePlayerInput()** receives it
3. **Calls session.applyPlayerInput()** to update velocity
4. **Next game tick** moves player based on velocity

### Movement Logic:
```typescript
// Player speed: 200 pixels/second
const PLAYER_SPEED = 200;
const speedMultiplier = hasSpeedBoost ? 1.5 : 1.0;

// Normalize diagonal movement to prevent faster diagonal speed
const magnitude = sqrt(dx² + dy²);
velocity.x = (direction.x / magnitude) * speed;
velocity.y = (direction.y / magnitude) * speed;

// Position += velocity * deltaTime (each tick)
position.x += velocity.x * TICK_INTERVAL_MS;
position.y += velocity.y * TICK_INTERVAL_MS;

// Clamp to boundaries
position.x = clamp(position.x, radius, 500 - radius);
position.y = clamp(position.y, radius, 500 - radius);
```

### Speed Modifiers:
- **Normal**: 200 px/s
- **With Speed Boost**: 200 × 1.5 = 300 px/s
- **NPC**: 20 px/s (slow wandering)

---

## NPC Spawning & Behavior (`server/game/npc-spawner.ts`)

### NPC Types:
```
Pink Fish:   XP: 10,  Size: 1.0,  Spawn: every 1.5s,  Max: 5
Grey Fish:   XP: 25,  Size: 1.2,  Spawn: every 4s,    Max: 3
Brown Fish:  XP: 50,  Size: 1.5,  Spawn: every 8s,    Max: 1
```

### Spawning Logic:
1. **Check spawn interval** - Has enough time passed since last spawn?
2. **Check capacity** - Are we at max for this type?
3. **Find safe location** - Spawn away from all players (>50px)
4. **Create NPC** - Add to state.npcs array
5. **Set random velocity** - Initial wandering direction

### NPC AI (Wandering):
```typescript
// Every tick:
position += velocity * deltaTime;

// 10% chance per tick to change direction
if (Math.random() < 0.1) {
  const angle = Math.random() * 2π;
  const speed = 20; // pixels/second
  velocity = (cos(angle), sin(angle)) * speed;
}

// Bounce off boundaries
if (touchesBoundary) {
  velocity.x *= -1;
  velocity.y *= -1;
}
```

---

## Collision Detection (`server/game/collision.ts`)

### Eating Mechanic (Size-Based)
**Rule**: `Player can eat NPC if playerRadius ≥ npcRadius`

#### Growth Phases:
```
Growth Phase 1:  XP: 0-49,    Radius: 12px, Size: 1.0x
Growth Phase 2:  XP: 50-149,  Radius: 18px, Size: 1.5x
Growth Phase 3:  XP: 150+,    Radius: 24px, Size: 2.0x
```

#### Collision Processing:
1. **Check circle collision** - distance between centers < r1 + r2
2. **Check if player can eat NPC** - player radius ≥ NPC radius
3. **Check grace period** - player in grace? (skip eating)
4. **Apply XP**:
   - Base XP: NPC.xp (10, 25, or 50)
   - With Double-XP powerup: × 2
5. **Remove NPC** from state
6. **Update leaderboard**

### Grace Period (Anti-Spawn-Kill):
- Duration: 2 seconds after respawn
- Effect: Player cannot be eaten during grace period
- Visual: Client renders player with opacity 0.5

### Boundary Collision:
- Players clamp to boundaries (no wrapping)
- NPCs bounce off walls (reverse velocity)

---

## Leaderboard

Updated whenever:
- Player gains XP (eating)
- Player respawns (XP reset to 0)

**Sorting**: By XP descending

---

## Example Game Flow

```
T=0s:    Game starts, 2 players at center
         NPCs start spawning (pink at 1.5s, grey at 4s, brown at 8s)

T=3s:    Pink NPC spawned
         Player 1 eats it: +10 XP (total: 10)

T=6s:    Grey NPC spawned
         Player 2 eats it: +25 XP (total: 25)
         Player 2 grows (Phase 1→2, radius 12→18px)
         
T=10s:   Player 1 eats another pink: +10 XP (total: 20)
         Player 1 tries to eat grey... TOO SMALL (radius 12 < 14)
         
T=60s:   Player 2 eats brown: +50 XP (total: 75)
         Player 2 grows to Phase 3 (radius 24px)
         
T=120s:  Game ends
         Final leaderboard:
         1. Player 2: 75 XP
         2. Player 1: 20 XP
```

---

## Key Design Decisions

### Size-Based Eating
- Makes progression natural: eat small fish → grow → eat bigger fish
- Creates strategic decision: eat many small or wait for big?

### Server-Authoritative
- All game logic on server (no client cheating)
- Client is view-only (can only send inputs)
- State broadcasts every 100ms (10 Hz)

### Fixed 60 Hz with Variable Broadcast
- Server ticks at 60 Hz (smooth collision detection)
- Only broadcasts every 6 ticks (reduces network traffic)
- Client interpolates between states

### Deterministic Collision Order
- Players sorted by joinOrder
- Prevents different players seeing different collision results
- Important for competitive fairness

---

## Performance Considerations

- **60 tick/s × 8 players × 5 NPCs** = ~2400 collision checks/sec
- **Spatial hashing** could optimize further (not yet implemented)
- **State serialization** at 10 Hz keeps bandwidth low

---

## Future Enhancements

- [ ] Power-up collection (speed-boost, double-xp)
- [ ] Player-vs-player collision (pushing)
- [ ] Spectator mode
- [ ] Replay system
- [ ] Replay seeking with fast-forward/rewind
