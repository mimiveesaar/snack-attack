# Data Model: Multiplayer Server v1

## GameSession

**Represents**: An active multiplayer session tied to a lobby.

**Fields**:
- `sessionId`: string
- `lobbyId`: string
- `status`: "active" | "ended"
- `gamemode`: "singleplayer" | "multiplayer"
- `tickRate`: number (fixed at 60)
- `startedAtMs`: number (server time)
- `players`: PlayerConnection[]
- `hostiles`: HostileEntity[]

**Relationships**:
- One `GameSession` belongs to one lobby.
- One `GameSession` has many `PlayerConnection` records.

**State transitions**:
- `active` → `ended` when last player disconnects.

## PlayerConnection

**Represents**: Association between a lobby player id and a live socket connection.

**Fields**:
- `playerId`: string
- `socketId`: string
- `ready`: boolean
- `connected`: boolean
- `joinedAtMs`: number

**Relationships**:
- Belongs to one `GameSession`.

**State transitions**:
- `ready=false` → `ready=true` after validated ready packet.
- `connected=true` → `connected=false` on disconnect.

## HostileEntity

**Represents**: A non-local entity that is sent to a player in snapshots (other players or NPCs).

**Fields**:
- `entityId`: string
- `position`: { `x`: number; `y`: number }
- `velocity`: { `x`: number; `y`: number }

## HostileSnapshot

**Represents**: Per-tick broadcast data for a player.

**Fields**:
- `sessionId`: string
- `tick`: number
- `serverTimeMs`: number
- `entities`: HostileEntity[]

## GameStore

**Represents**: In-memory registry of active sessions.

**Fields**:
- `sessionsByLobbyId`: Map<string, GameSession>
- `sessionsById`: Map<string, GameSession>

**Rules**:
- Session removed immediately when last player disconnects.
