# Data Model: Initial Game View (Background & Atmosphere)

## Entities

### MapSeed
- **Fields**: `value` (string)
- **Notes**: Sourced from `/game?seed=`; normalized before use.

### BackgroundLayout
- **Fields**: `seed` (MapSeed), `terrain` (TerrainLayer), `elements` (AmbientElement[])
- **Relationships**: One layout per seed; contains many ambient elements.

### TerrainLayer
- **Fields**: `dirtSprite` (asset reference), `sandSprite` (asset reference)
- **Notes**: Static background layers for the game view.

### AmbientElement (base)
- **Fields**: `id` (string), `type` ("rock" | "seaweed" | "bubble"), `position` (x,y), `size` (multiplier), `variant` (asset reference)
- **Notes**: Deterministically generated from seed.

#### Rock (AmbientElement)
- **Additional Fields**: `size` (multiplier within defined bounds)

#### Seaweed (AmbientElement)
- **Additional Fields**: `size` (multiplier within defined bounds)

#### Bubble (AmbientElement)
- **Additional Fields**: `size` (multiplier within defined bounds), `durationMs`, `delayMs`, `startYOffset`, `endYOffset`

## Validation Rules

- `seed` must be a non-empty string after normalization; fallback to default seed if missing/invalid.
- `position.x` and `position.y` must lie within the fixed viewport bounds.
- `size` multiplier must be within a defined range (e.g., 0.6–1.4) to prevent extreme scaling.
- Bubble animation timing must be positive and within a reasonable range (e.g., 3–12 seconds).
- Bubble `startYOffset` begins at or below the ground baseline; `endYOffset` ends above the top threshold.

## State Transitions (Bubbles)

- **Spawned** → **Rising** → **Reset** (looped)
- The loop is deterministic per bubble using seeded timing values.
