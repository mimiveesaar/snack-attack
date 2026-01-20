# Data Model: PvP Fish Eating

## Entities

### GameState
Represents the authoritative state for a game session.
- **Fields**:
  - `players: GamePlayer[]`
  - `npcs: GameNPC[]`
  - `leaderboard: GameLeaderboardEntry[]`
  - `serverTick: number`
- **Relationships**: Owns all `GamePlayer` entities for collision and respawn logic.

### GamePlayer
Represents a player fish during gameplay.
- **Fields**:
  - `id: string`
  - `nicknameDisplay: string`
  - `xp: number`
  - `growthPhase: 1 | 2 | 3`
  - `collisionRadius: number`
  - `status: 'alive' | 'respawning' | 'spectating'`
  - `respawnTimeMs: number | null`
  - `graceEndTimeMs: number | null`
  - `powerups: ('speed-boost' | 'double-xp' | 'invincibility')[]`
- **Validation rules**:
  - Player-vs-player eating is allowed only when eater XP is strictly higher than target XP.
  - If `status !== 'alive'`, the player is excluded from collision checks.
  - Players in grace period (`now < graceEndTimeMs`) cannot be eaten.

### GameEvent (Fish Eaten)
Represents a resolved collision event broadcast to clients.
- **Fields**:
  - `type: 'fish-eaten'`
  - `data.eatenPlayerId?: string`
  - `data.eatenByPlayerId?: string`
  - `data.eatenByNpcId?: string`
  - `data.xpTransferred?: number` (unused for player-vs-player; should be 0 or omitted)

## State Transitions

### Player-vs-Player Eat
- **From**: `alive`
- **To**: `respawning`
- **Trigger**: Collision between two players where eater has strictly higher XP and target is not in grace/invincibility.
- **Side effects**:
  - Target player XP resets to baseline.
  - Target growth phase resets to 1.
  - Target respawn timer starts (same delay as NPC-eat).
  - Eater gains no XP from this event.
  - Leaderboard updates immediately.

### Respawn Completion
- **From**: `respawning`
- **To**: `alive`
- **Trigger**: `respawnTimeMs` elapsed.
- **Side effects**:
  - New safe position assigned.
  - Grace period active until `graceEndTimeMs`.

## Derived UI Data

### Player XP Label
- **Source**: `GamePlayer.nicknameDisplay`, `GamePlayer.xp`
- **Format**: Rendered adjacent to nickname in the fish label (e.g., `Name • 120 XP`).
- **Update**: On each state update broadcast (10 Hz).
