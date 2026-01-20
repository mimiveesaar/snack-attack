# Data Model: Waiting Lobby Enhancements

## Entities

### Lobby
- **Fields**
  - `id`: string (unique lobby identifier)
  - `players`: LobbyPlayer[]
  - `maxPlayers`: number (fixed at 4 for this feature)
  - `status`: 'idle' | 'in-game'
  - `waitingQueue`: WaitingPlayer[]
- **Validation Rules**
  - `players.length` must be ≤ `maxPlayers`
  - `waitingQueue` order is FIFO by `joinedAt`
- **Relationships**
  - Has many `LobbyPlayer`
  - Has many `WaitingPlayer`
  - Has zero or one `ActiveGameSnapshot`

### LobbyPlayer
- **Fields**
  - `playerId`: string
  - `nickname`: string
  - `color`: string
  - `joinedAt`: number (ms timestamp)
- **Validation Rules**
  - `nickname` non-empty
  - `playerId` unique within `players`

### WaitingPlayer
- **Fields**
  - `playerId`: string
  - `nickname`: string
  - `color`: string
  - `joinedAt`: number (ms timestamp)
  - `status`: 'waiting'
- **Validation Rules**
  - `status` always 'waiting' while queued
  - FIFO order based on `joinedAt`
- **State Transitions**
  - `waiting` → admitted (removed from queue; becomes `LobbyPlayer`) when game ends and a slot is available
  - `waiting` → removed on disconnect

### ActiveGameSnapshot
- **Fields**
  - `hasActiveGame`: boolean
  - `timerRemainingMs`: number | null
  - `leaderboard`: LeaderboardEntry[]
- **Validation Rules**
  - If `hasActiveGame` is false, `timerRemainingMs` is null and `leaderboard` is empty
  - If `hasActiveGame` is true, `timerRemainingMs` ≥ 0

### LeaderboardEntry
- **Fields**
  - `playerId`: string
  - `nickname`: string
  - `score`: number
  - `rank`: number
- **Validation Rules**
  - `rank` is 1-based, unique per snapshot

## Notes
- Lobby capacity is fixed at 4 players for this feature.
- Waiting-screen timer text “No active game” is derived from `hasActiveGame=false`.
