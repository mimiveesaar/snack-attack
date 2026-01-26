# Data Model: Singleplayer Lobby Customization

## Entities

### OpponentSlot
Represents a configurable virtual opponent in singleplayer setup.

**Fields**
- `slotId`: number (1–3)
- `name`: string
- `color`: 'red' | 'blue' | 'green' | 'orange'
- `isActive`: boolean (true when the slot is enabled)

**Validation Rules**
- Maximum of 3 slots.
- `slotId` must be unique per lobby.
- `name` defaults to "Opponent {slotId}" when blank.
- `color` must be one of the allowed values.

### SingleplayerLobbySettings
Represents singleplayer-specific settings stored in lobby state.

**Fields**
- `difficulty`: 'easy' | 'medium' | 'hard'
- `opponents`: OpponentSlot[]

**Validation Rules**
- `opponents.length` may be 0–3.
- At least one `OpponentSlot` is created by default but can be deactivated/removed.

## Relationships

- `LobbyState` includes `SingleplayerLobbySettings` when `gamemode` is `singleplayer`.

## State Transitions

- On opening Manage Opponents: ensure slot 1 exists and is active.
- On remove: set `isActive = false` (or remove from list) for the selected slot.
- On add: add a new slot with the next available `slotId` up to 3.
- On name blur or update: apply default name if blank.
