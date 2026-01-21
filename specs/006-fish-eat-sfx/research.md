# Research: Fish Eat Crunch Sound

## Decision 1: Use Web Audio API with decoded buffer
- **Decision**: Load `small-crunch.mp3` into an `AudioBuffer` via `fetch` + `decodeAudioData`, then play via `AudioBufferSourceNode` and `GainNode` routed through the existing `masterGain`.
- **Rationale**: Reuses the existing `AudioContext` and global volume/mute handling, keeps latency low, and avoids adding dependencies.
- **Alternatives considered**:
  - HTMLAudioElement per play (simple, but harder to align with existing `masterGain` and overlap control).
  - Third-party audio library (rejected by constitution’s minimal dependency rule).

## Decision 2: Allow overlapping playback
- **Decision**: Allow multiple crunch sounds to play concurrently with no cap.
- **Rationale**: Ensures every fish-eaten event triggers a crunch sound, even during rapid sequences.
- **Alternatives considered**:
  - Global cooldown (rejected; would drop legitimate rapid events).
  - Overlap cap (rejected; could suppress valid events).

## Decision 3: Fail silently when asset is missing
- **Decision**: On load failure, store `null` buffer and no-op playback without throwing or logging analytics.
- **Rationale**: Matches requirements for silent failure and uninterrupted gameplay.
- **Alternatives considered**:
  - Fallback sound (rejected by clarified requirement).
  - Hard error or blocking behavior (rejected; would disrupt gameplay).

## Decision 4: Client-only implementation
- **Decision**: Use existing `fish-eaten` events from `game:state-update`; no new server events or API changes.
- **Rationale**: The event already exists and is received client-side in `GameManager`.
- **Alternatives considered**:
  - New event type or payload changes (rejected; unnecessary scope).
