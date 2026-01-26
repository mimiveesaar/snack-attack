# Research: Singleplayer Lobby Customization

## Decisions

### 1) Store singleplayer opponent settings in lobby state
- **Decision**: Extend lobby state to include singleplayer opponent slots and send updates via existing lobby settings flow.
- **Rationale**: Reuses the existing lobby state propagation and avoids new endpoints or storage.
- **Alternatives considered**: Client-only storage (rejected because the server needs opponents when the game starts); separate dedicated socket event (rejected to minimize surface area).

### 2) Use Lit-based overlay with CSS-only layout
- **Decision**: Implement the Manage Opponents overlay as a Lit component/modal using existing styling patterns.
- **Rationale**: Aligns with current UI framework and avoids new dependencies while keeping UX simple.
- **Alternatives considered**: Third-party modal library (rejected due to dependency constraints).

### 3) Immediate-apply edits in overlay
- **Decision**: Apply changes immediately on edit (no save/apply button).
- **Rationale**: Matches clarified requirement and keeps UX minimal.
- **Alternatives considered**: Save/Apply button or apply-on-close (rejected per clarification).

### 4) Duplicate opponent colors allowed
- **Decision**: Allow duplicate colors among opponents.
- **Rationale**: Avoids extra UI validation complexity and is permitted by spec assumptions.
- **Alternatives considered**: Enforce unique colors (rejected; not required).
