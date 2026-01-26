# Data Model: Virtual Opponent Movement

## Entities

### VirtualOpponentProfile
Defines behavior tuning per difficulty.

**Fields**
- `difficulty`: 'easy' | 'medium' | 'hard'
- `reactionIntervalMs`: number (time between decision updates)
- `targetSwitchIntervalMs`: number (minimum time before switching targets)
- `riskTolerance`: number (0–1; higher = more aggressive)
- `jitterStrength`: number (0–1; randomness added to direction)

### VirtualOpponentState
Runtime decision state for each virtual opponent.

**Fields**
- `playerId`: string (bot player id)
- `profile`: VirtualOpponentProfile
- `currentTargetId`: string | null
- `lastDecisionAt`: number (timestamp)
- `nextDecisionAt`: number (timestamp)
- `lastDirectionChangeAt`: number (timestamp)
- `seed`: number (per-bot randomness)

### BotRoster
Session-level registry for bot states.

**Fields**
- `byPlayerId`: Record<string, VirtualOpponentState>

## Relationships

- `GameSessionState.players` includes bot players identified by an `isBot` flag or by `playerId` prefix.
- `BotRoster` is owned by the game loop or bot manager for the active session.

## Validation Rules

- Only bots use `VirtualOpponentState`.
- Bots are only created in singleplayer sessions.
- Behavior profile must match the selected difficulty.

## State Transitions

- On session start: create bot players and initialize `VirtualOpponentState`.
- On each tick: if `now >= nextDecisionAt`, update target/direction using profile rules.
- On bot removal: delete state from `BotRoster`.
