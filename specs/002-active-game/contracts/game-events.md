# Game Events Contract: Socket.IO `/game` Namespace

## Namespace
- `/game`: Real-time gameplay synchronization; separate room per game session

## Client → Server Events

### `game:player-ready`
Emitted when client has loaded game scene and is ready to receive state updates.
```typescript
{
  playerId: string;
  timestamp: number; // client Unix time in ms
}
```
**Purpose**: Associate player with socket connection; signal readiness for game state.

---

### `game:player-input`
Emitted on every client tick; sent whether input changed or not.
```typescript
{
  playerId: string;
  direction: { x: -1 | 0 | 1; y: -1 | 0 | 1 }; // keyboard state
  timestamp: number; // client Unix time in ms
  tick: number; // client tick counter (for sequencing)
}
```
**Purpose**: Relay player movement input to server for authoritative processing.
**Frequency**: Every ~16.67ms (60 Hz client tick)

---

### `game:pause-toggle`
Emitted by leader only; request to pause or resume game.
```typescript
{
  playerId: string;
  isPaused: boolean; // true = request pause, false = request resume
  timestamp: number; // client Unix time in ms
}
```
**Purpose**: Leader pause/resume control.
**Validation**: Server checks playerId is leader before applying.

---

### `game:player-quit`
Emitted when player voluntarily exits game.
```typescript
{
  playerId: string;
  timestamp: number;
}
```
**Purpose**: Graceful disconnect; player removed from game, marked as "Quit" on leaderboard.

---

## Server → Client Events

### `game:state-update`
Broadcast to all players in game room; sent at 10 Hz (every ~100ms).
```typescript
{
  serverTick: number; // authoritative server tick
  timestamp: number; // server Unix time in ms
  
  // World state
  players: Array<{
    playerId: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    xp: number;
    growthPhase: 1 | 2 | 3;
    visualSize: number;
    status: 'alive' | 'respawning' | 'spectating';
    powerups: ('speed-boost' | 'double-xp')[];
    color: string;
    nicknameDisplay: string;
  }>;
  
  npcs: Array<{
    id: string;
    type: 'pink' | 'grey' | 'brown';
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    visualSize: number;
  }>;
  
  powerups: Array<{
    id: string;
    type: 'speed-boost' | 'double-xp';
    position: { x: number; y: number };
  }>;
  
  // Game state
  status: 'active' | 'paused' | 'ended';
  isPaused: boolean;
  pausedByLeaderNickname: string | null;
  timerRemainingMs: number;
  
  // Events that occurred this tick
  events: CollisionEvent[];
  
  // Leaderboard
  leaderboard: Array<{
    playerId: string;
    nicknameDisplay: string;
    rank: number;
    xp: number;
    status: 'active' | 'respawning' | 'spectating' | 'quit';
    isLeader: boolean;
  }>;
}
```
**Purpose**: Authoritative game state; clients use this to render and reconcile prediction.
**Frequency**: 10 Hz (~100ms)

---

### `game:collision`
Emitted when a notable collision is resolved (for client-side visual effects).
```typescript
{
  type: 'fish-eaten' | 'powerup-collected' | 'respawn-complete';
  tick: number;
  data: {
    // For fish-eaten
    eatenFishId?: string;
    eatenByPlayerId?: string;
    xpTransferred?: number;
    eatenByNewXp?: number;
    
    // For powerup-collected
    powerId?: string;
    collectedByPlayerId?: string;
    powerupType?: 'speed-boost' | 'double-xp';
    
    // For respawn-complete
    respawnedPlayerId?: string;
    respawnPosition?: { x: number; y: number };
  };
}
```
**Purpose**: Trigger client-side animations, sound effects, visual feedback.
**Frequency**: As collisions occur (variable)

---

### `game:player-disconnected`
Emitted when a player disconnects or quits; broadcast to all.
```typescript
{
  playerId: string;
  nicknameDisplay: string;
  reason: 'quit' | 'timeout' | 'error';
  timestamp: number;
}
```
**Purpose**: Notify all players of a disconnect; update leaderboard.

---

### `game:timer-tick`
Emitted every second; provides authoritative time remaining.
```typescript
{
  serverTick: number;
  timerRemainingMs: number;
  timestamp: number;
}
```
**Purpose**: Sync client timer display with server; prevent client-side timer drift.
**Frequency**: Every 1 second (60 ticks)

---

### `game:paused`
Emitted when game is paused.
```typescript
{
  pausedByLeaderId: string;
  pausedByLeaderNickname: string;
  timestamp: number;
}
```
**Purpose**: Notify all players game is paused; lock controls.

---

### `game:resumed`
Emitted when game is resumed.
```typescript
{
  resumedByLeaderId: string;
  resumedByLeaderNickname: string;
  timestamp: number;
}
```
**Purpose**: Notify all players game resumed; unlock controls.

---

### `game:ended`
Emitted when game ends (timer reaches 0 or all players quit).
```typescript
{
  sessionId: string;
  lobbyId: string;
  winner: {
    playerId: string;
    nicknameDisplay: string;
    xp: number;
  } | null;
  leaderboard: Array<{
    playerId: string;
    nicknameDisplay: string;
    rank: number;
    xp: number;
    status: 'active' | 'quit';
  }>;
  totalDurationMs: number;
  timestamp: number;
}
```
**Purpose**: Signal game end and display results screen.

---

### `game:error`
Emitted on error conditions (invalid input, player not found, etc.).
```typescript
{
  code: string; // e.g., 'PLAYER_NOT_FOUND', 'INVALID_INPUT', 'GAME_ENDED'
  message: string;
  timestamp: number;
}
```
**Purpose**: Debug and handle client-side errors gracefully.

---

## Clock Synchronization

### `game:sync-request` (Client → Server)
```typescript
{
  clientTimestamp: number; // client Unix time when sent
}
```

### `game:sync-response` (Server → Client)
```typescript
{
  clientTimestamp: number; // echo of request
  serverTimestamp: number; // server Unix time
}
```
**Purpose**: Calculate network latency and time offset; used for input reconciliation.
**Frequency**: Sent once on connection, then periodically (~5s) to recalibrate.

---

## Key Notes

- **Tick Synchronization**: Every server event includes `serverTick` counter; clients use this to detect missed packets or out-of-order arrival.
- **Event Packaging**: Collisions and state updates sent together in `game:state-update` to ensure atomicity.
- **Power-up Expiration**: Tracked by server; clients trust server authoritative durations.
- **Leaderboard**: Broadcast in every `game:state-update`; reflects real-time standings.
- **Pause State**: `isPaused` and `pausedByLeaderNickname` included in `game:state-update`; separate `game:paused` / `game:resumed` events for UI signals.
- **Graceful Disconnect**: Player immediately appears as "quit" on leaderboard on disconnect; actual removal happens after 30s grace period (for future rejoin).

## Collision Event Types

```typescript
interface CollisionEvent {
  type: 'fish-eaten' | 'powerup-collected' | 'respawn-complete' | 'boundary-hit';
  tick: number;
  subject: { playerId: string } | { npcId: string };
  object?: { playerId: string } | { npcId: string } | { powerId: string };
  data: {
    xpTransferred?: number;
    newXp?: number;
    powerupType?: 'speed-boost' | 'double-xp';
    position?: { x: number; y: number };
  };
}
```

Collision events are deterministic and resolved in joinOrder sequence per server tick.
