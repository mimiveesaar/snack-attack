# Socket Events قرارداد: Multiplayer Server v1

Namespace: /lobby (Socket.IO)

## Client → Server

### game:ready

Associates a lobby player id with the current socket connection.

**Payload**
- `lobbyId`: string
- `playerId`: string

**Ack**
- `ok`: boolean
- `error?`: string

**Errors**
- `invalid-player`: player id is not a member of the lobby
- `lobby-not-found`: lobby id is invalid
- `session-active`: session already started; mid-game joins are not allowed

---

### game:input (placeholder for future)

Not implemented in v1. Reserved for player input messages.

## Server → Client

### game:tick

Per-tick packet containing hostile snapshot data (players + NPCs), with room for future fields.

**Payload**
- `sessionId`: string
- `tick`: number
- `serverTimeMs`: number
- `hostiles`: Array<{
  - `entityId`: string
  - `position`: { `x`: number; `y`: number }
  - `velocity`: { `x`: number; `y`: number }
}>

---

### game:playerDisconnected

Notifies remaining players that a player has disconnected.

**Payload**
- `playerId`: string
- `reason`: "disconnect" | "kicked"

---

### game:sessionEnded

Notifies players that the session ended because the last player left.

**Payload**
- `sessionId`: string
- `reason`: "empty"

---

## Notes

- Tick packets are broadcast every simulation tick (60 Hz).
- Ready is acknowledged only after validating the player id against the lobby.
- Duplicate ready associations keep the newest connection and disconnect the prior socket.
- Mid-game joins are rejected with `session-active`.
