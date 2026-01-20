# Socket Contracts: Waiting Lobby Enhancements

## Namespace
- `/lobby`

## Client → Server Events
- `lobby:join` — { lobbyId: string, nickname: string, color: string }
- `lobby:leave` — { lobbyId: string }

## Server → Client Events
- `game:waiting` — Sent to waiting players while a game is active.
  - Payload:
    - `lobbyId`: string
    - `waitingPosition`: number (1-based position in FIFO queue)
    - `isLobbyFull`: boolean
    - `fullMessage`: string | null (must be “Lobby full (4/4). Waiting for a slot.” when `isLobbyFull` is true)
    - `snapshot`:
      - `hasActiveGame`: boolean
      - `timerRemainingMs`: number | null
      - `leaderboard`: Array<{ playerId: string, nickname: string, score: number, rank: number }>

- `lobby:state` — Updated lobby roster once a waiting player is admitted.
  - Payload:
    - `lobbyId`: string
    - `players`: Array<{ playerId: string, nickname: string, color: string }>
    - `maxPlayers`: number
    - `status`: 'idle' | 'in-game'

- `game:ended` — Game completion notification for all lobby clients.
  - Payload:
    - `sessionId`: string
    - `lobbyId`: string
    - `seatsAvailable`: number
    - `leaderboard`: Array<{ playerId: string, nickname: string, score: number, rank: number }>

## Timing & Delivery Rules
- `game:waiting` snapshots must reach waiting clients within ≤2 seconds of leaderboard or timer changes.
- A full snapshot is emitted when a client first enters waiting and periodically thereafter.
- If `snapshot.hasActiveGame` is false, the client must display “No active game” in the timer area.
