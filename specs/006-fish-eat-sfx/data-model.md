# Data Model: Fish Eat Crunch Sound

## Entities

### SoundEffectAsset
- **Purpose**: Represents an audio asset used for a sound effect.
- **Fields**:
  - `key`: string (e.g., `"crunch"`)
  - `url`: string (resolved asset URL via `import.meta.url`)
  - `buffer`: AudioBuffer | null (loaded at runtime)

### SoundPlaybackState
- **Purpose**: Tracks active playback to enforce overlap limits.
- **Fields**:
  - `activeSources`: AudioBufferSourceNode[]
  - `activeCount`: number

## Relationships
- `SoundEffectAsset` is used by `SoundPlaybackState` to create playback sources.

## Validation Rules
- If `buffer` is null, playback is skipped without error.

## State Transitions
- `buffer`: `null` → `AudioBuffer` on successful load.
- `activeSources`: add source on play; remove on `ended` event.
