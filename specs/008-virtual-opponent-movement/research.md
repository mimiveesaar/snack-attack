# Research: Virtual Opponent Movement

## Decisions

### 1) Server-authoritative bot inputs
- **Decision**: Generate bot inputs on the server each tick and apply them via existing player movement logic.
- **Rationale**: Reuses authoritative movement and collision handling while keeping clients passive.
- **Alternatives considered**: Client-side bot control (rejected due to desync risk) and separate physics pipeline (rejected for complexity).

### 2) Difficulty-based behavior profiles
- **Decision**: Define distinct behavior profiles per difficulty (reaction interval, target switching rate, risk tolerance).
- **Rationale**: Aligns with the existing difficulty setting and makes opponents feel human-like at each level.
- **Alternatives considered**: Single profile with speed-only scaling (rejected as too shallow).

### 3) Anti-loop movement variation
- **Decision**: Introduce periodic target switching and jitter to avoid repetitive movement loops.
- **Rationale**: Meets the non-stall requirement while keeping logic simple and readable.
- **Alternatives considered**: Complex pathfinding (rejected for complexity and dependency constraints).

### 4) No menu interactions for bots
- **Decision**: Bots never emit pause/restart/quit actions; they only affect movement inputs.
- **Rationale**: Ensures menus remain player-only as required.
- **Alternatives considered**: Unified input pipeline including menus (rejected).
