# Research: Multiplayer Server v1

## Decision 1: Fixed-timestep simulation loop (60 TPS)

- **Decision**: Use a fixed-timestep accumulator loop at 60 TPS with lag clamping and a cap on catch-up steps, driven by a monotonic clock.
- **Rationale**: Ensures consistent simulation speed despite server lag and avoids variable-delta instability; aligns with spec and existing client loop patterns.
- **Alternatives considered**:
  - Variable delta per frame (rejected: unstable gameplay under lag).
  - Fixed `setInterval` without drift compensation (rejected: timer drift and spiral-of-death risk).

## Decision 2: Snapshot broadcast cadence

- **Decision**: Broadcast hostile snapshots every simulation tick (60 Hz).
- **Rationale**: Explicit clarification from spec; keeps clients in sync with authoritative state at the same cadence.
- **Alternatives considered**:
  - Lower broadcast rate (20–30 Hz) with interpolation (rejected: not aligned with clarified requirement).
  - Change-only broadcasts (rejected: inconsistent update cadence).

## Decision 3: Session end policy

- **Decision**: End a session immediately when the last player disconnects.
- **Rationale**: Avoids orphaned sessions and matches clarified behavior.
- **Alternatives considered**:
  - Grace period for reconnection (rejected: not requested).
  - Keep sessions alive until manual stop (rejected: unnecessary complexity).

## Decision 4: Ready association validation

- **Decision**: Validate player id against the lobby before acknowledging ready; keep the newest connection on duplicates.
- **Rationale**: Prevents spoofed associations and enforces a single authoritative connection per player.
- **Alternatives considered**:
  - Accept ready then validate later (rejected: allows invalid association).
  - Keep the oldest connection (rejected: conflicts with reconnection expectations).

## Decision 5: Invalid ready handling

- **Decision**: Respond with an error and allow retry without disconnecting.
- **Rationale**: Provides clear feedback while keeping the connection available for correction.
- **Alternatives considered**:
  - Disconnect immediately (rejected: harsh for recoverable errors).
  - Ignore silently (rejected: no feedback for client).

## Decision 6: Start with ready subset

- **Decision**: Start the session with the currently ready players even if some lobby players are not ready.
- **Rationale**: Clarified behavior; avoids stalling game start.
- **Alternatives considered**:
  - Timeout and cancel (rejected: not required).
  - Wait indefinitely (rejected: blocks gameplay).

## Decision 7: Storage model

- **Decision**: Keep game sessions and player connections in server memory only.
- **Rationale**: Fits current architecture (no persistence layer) and scope for initial multiplayer.
- **Alternatives considered**:
  - Persist to database/redis (rejected: unnecessary complexity for v1).
