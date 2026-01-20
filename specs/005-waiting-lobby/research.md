# Research: Waiting Lobby Enhancements

## Decision 1: Room-scoped waiting updates with single snapshot event
- **Decision**: Use a single waiting-state snapshot event to the waiting-room audience that includes leaderboard + timer state.
- **Rationale**: A single event keeps the UI and server logic simple, reduces event handling complexity, and avoids race conditions between separate timer/leaderboard streams. Room targeting keeps traffic limited to waiting clients.
- **Alternatives considered**: Separate events for timer and leaderboard (higher complexity, more handlers); full global broadcast to all sockets (wasteful and noisy).

## Decision 2: Snapshot on join + periodic refresh ≤2s
- **Decision**: Emit a full snapshot when a client enters the waiting state, then refresh on a ≤2s cadence or on significant changes (game end, leaderboard changes).
- **Rationale**: Ensures clients always converge to a correct view even after reconnects or missed updates, while meeting the ≤2s update requirement.
- **Alternatives considered**: Event-only deltas without periodic snapshots (risk of drift after packet loss); high-frequency updates every tick (unnecessary bandwidth).

## Decision 3: Server-driven timer base with client display fallback
- **Decision**: Send `hasActiveGame` + `timerRemainingMs` (nullable) and let the client render “No active game” when there is no active game.
- **Rationale**: Keeps the server authoritative while allowing the client to display a consistent idle state without extra event types.
- **Alternatives considered**: Dedicated `timer:idle` event (extra event type); sending string labels from server (less structured, harder to validate).
