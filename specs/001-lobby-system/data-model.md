# Data Model: Snack Attack Lobby System

## Entities

### Player
- **id**: string (stable socket/client identifier)
- **nicknameBase**: string (user input, validated 1-31 alphanumeric)
- **nicknameDisplay**: string (deduped display, e.g., "Alex (2)")
- **color**: string (palette key/hex)
- **isLeader**: boolean
- **joinOrder**: number (monotonic per lobby)
- **connected**: boolean

### Lobby
- **lobbyId**: string (route id `/lobby/{id}`)
- **players**: Player[] (ordered by joinOrder)
- **gamemode**: enum { singleplayer, multiplayer }
- **difficulty**: enum { easy, medium, hard }
- **maxPlayers**: number (1 for singleplayer, 4 for multiplayer)
- **status**: enum { waiting, active }
- **shareUrl**: string (derived from lobbyId)
- **createdAt**: ISO string

### GameSession
- **sessionId**: string
- **lobbyId**: string
- **status**: enum { active, ended }
- **timerRemainingMs**: number
- **leaderboard**: LeaderboardEntry[]
- **seatsAvailable**: number (when ending to admit waiting players)

### LeaderboardEntry
- **playerId**: string
- **nicknameDisplay**: string
- **score**: number

## Relationships
- Lobby has many Players (ordered by joinOrder).
- Lobby has zero or one active GameSession; GameSession belongs to one Lobby.
- LeaderboardEntry belongs to GameSession and references Player.

## Validation Rules
- Nickname: length 1-31, alphanumeric only; dedupe within lobby by suffixing `(n)`.
- Gamemode: singleplayer → maxPlayers = 1; multiplayer → maxPlayers = 4.
- Difficulty: one of easy/medium/hard.
- Player join blocked when lobby full or when status=active and no seats available; queued joiners remain in waiting view.

## State Transitions
- Lobby status: waiting → active (on start game); active → waiting (on game end, with optional queued admissions).
- Gamemode switch: multiplayer → singleplayer triggers immediate removal of non-leader players and maxPlayers=1; switching back re-enables capacity up to 4.
- Leader promotion: on leader disconnect, promote next by joinOrder; if none remain, delete lobby.
