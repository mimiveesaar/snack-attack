# Data Model: Player Nickname Labels

## Entities

### PlayerLabel (derived view model)
- **playerId**: string
- **nicknameDisplay**: string
- **position**: { x: number; y: number }
- **labelText**: string (possibly truncated for display)
- **offsetY**: number (vertical offset above fish)

## Relationships
- PlayerLabel is derived from GamePlayer state on each state update.

## Validation Rules
- Label text is taken from `nicknameDisplay` and truncated to a max length when needed.
- Label color is white and font size is small relative to fish size.

## State Transitions
- Labels appear when the game view is active and update each tick with player position updates.
