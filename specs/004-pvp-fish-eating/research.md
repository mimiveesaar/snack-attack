# Research: PvP Fish Eating

## Decision: Use server-authoritative collision handling for PvP eats
- **Decision**: Implement player-vs-player eating checks in the server collision pipeline alongside NPC eating.
- **Rationale**: Server already resolves authoritative collisions at 60 Hz and applies respawn logic; extending this avoids client-side cheating and keeps ordering deterministic.
- **Evidence**: Server collision processing runs in `CollisionDetector.processNPCsEatingPlayers` and the game loop processes collisions each tick.
- **Alternatives considered**: Client-side collision handling (rejected due to non-authoritative and desync risk).

## Decision: Reuse existing NPC-eat respawn timing and grace period
- **Decision**: Use the existing 2s respawn delay and 2s grace period for player-eat respawns.
- **Rationale**: Respawn timing and grace protection already exist for NPC-eat flows; reuse keeps gameplay consistent and avoids new timing constants.
- **Evidence**: `setPlayerRespawning` sets respawn timing and grace window; game loop completes respawns when the timer elapses.
- **Alternatives considered**: Immediate respawn or custom delay (rejected per clarification).

## Decision: Reset XP on respawn and do not award XP to the eater
- **Decision**: When a player is eaten by another player, the eaten player’s XP resets to the baseline value and the eater receives no XP.
- **Rationale**: Clarified requirement; maintains anti-farming balance and matches existing respawn reset behavior.
- **Evidence**: `setPlayerRespawning` resets XP and growth phase; clarified spec requires no XP gain for player-eat events.
- **Alternatives considered**: Transfer XP or award partial XP (rejected by clarification).

## Decision: Display XP next to nickname using existing SVG label
- **Decision**: Extend the existing nickname label on each fish to include XP (e.g., `Name • 120 XP`).
- **Rationale**: Labels are already rendered in SVG text within the fish entity and updated through the player renderer; adding XP is a minimal change with no new UI layer.
- **Evidence**: `PlayerRenderer` sets nickname label text per player; `Fish` manages SVG `<text>` label positioning.
- **Alternatives considered**: Separate UI overlay or sidebar-only display (rejected for reduced visibility during gameplay).

## Decision: Storage remains in-memory only
- **Decision**: Keep game and lobby state in in-memory Maps (no persistence) for this feature.
- **Rationale**: Existing server architecture uses in-memory stores for sessions and lobbies; PvP eating does not require persistence.
- **Evidence**: Game sessions stored in `sessionStore` Map; lobbies stored in `LobbyStore` Map.
- **Alternatives considered**: Persisting state to disk or database (rejected as out of scope).

## Decision: Performance and scale align with existing loop and lobby caps
- **Decision**: Maintain 60 Hz server tick with 10 Hz broadcasts and a multiplayer cap of 4 players.
- **Rationale**: These limits are already defined in game loop and lobby capacity; PvP checks fit within existing tick budget.
- **Evidence**: Game loop constants define 60 Hz ticks and 10 Hz broadcasts; lobby store sets `MULTIPLAYER_CAP = 4`.
- **Alternatives considered**: Higher broadcast rate or larger lobby sizes (rejected as out of scope).
