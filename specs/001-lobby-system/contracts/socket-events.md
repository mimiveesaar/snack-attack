# Socket Contracts: Snack Attack Lobby

## Namespaces
- `/lobby`: primary namespace for lobby + game presence

## Client → Server Events
- `lobby:create` — { nickname: string, color: string }
- `lobby:join` — { lobbyId: string, nickname: string, color: string }
- `lobby:updateSettings` — { lobbyId: string, gamemode: 'singleplayer'|'multiplayer', difficulty: 'easy'|'medium'|'hard' }
- `lobby:start` — { lobbyId: string }
- `lobby:leave` — { lobbyId: string }

## Server → Client Events
- `lobby:state` — { lobbyId, players[], gamemode, difficulty, maxPlayers, status, shareUrl }
- `lobby:kicked` — { reason: 'capacity'|'leader-change' }
- `lobby:error` — { message: string, code?: string }
- `game:waiting` — { lobbyId, leaderboard, timerRemainingMs }
- `game:started` — { sessionId, lobbyId, players }
- `game:ended` — { sessionId, lobbyId, seatsAvailable, leaderboard }

## Rules
- All events are idempotent by `lobbyId` + payload version where applicable.
- State broadcasts (`lobby:state`) occur on joins, leaves, leader promotion, settings changes, and periodic heartbeats.
- Switching to singleplayer triggers `lobby:state` with trimmed player list and emits `lobby:kicked` to removed clients.
- Joining during active game yields `game:waiting`; admission after end emits `lobby:state` (updated roster) followed by `game:started` for next session when launched.
