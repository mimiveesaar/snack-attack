# Data Model: Player Movement (Client)

## Entities

### Fish
- **Purpose**: Base entity for all fish movement and rendering.
- **Fields**:
  - `id: string`
  - `position: Vec2` (x, y)
  - `velocity: Vec2`
  - `facingDirection: Vec2` (normalized)
  - `maxSpeed: number`
  - `acceleration: number`
  - `drag: number`
  - `wigglePhase: number`
  - `spriteSrc: string`
- **Rules**:
  - Vertical movement angle limited to 45° from horizontal.
  - Uses deterministic fixed-step updates.

### PlayerInputState
- **Purpose**: Snapshot of current input for deterministic steps.
- **Fields**:
  - `up: boolean`
  - `down: boolean`
  - `left: boolean`
  - `right: boolean`

### PlayerController
- **Purpose**: Applies `PlayerInputState` to a `Fish` entity.
- **Fields**:
  - `input: PlayerInputState`
  - `fishId: string`
- **Rules**:
  - Opposing inputs cancel per axis.

### FixedStepEngine
- **Purpose**: Drives deterministic updates and render interpolation.
- **Fields**:
  - `fixedDeltaSeconds: number` (0.0167)
  - `maxStepsPerFrame: number` (5)
  - `accumulatorSeconds: number`
  - `lastFrameTimeMs: number`

## Relationships
- `PlayerController` controls a single `Fish`.
- `FixedStepEngine` advances `Fish` state using `PlayerInputState`.

## State Transitions
- Input updates modify `PlayerInputState`.
- Each fixed step updates `Fish` position/velocity from controller input.
