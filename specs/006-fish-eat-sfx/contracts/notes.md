# Contracts: Fish Eat Crunch Sound

No API or socket contract changes required.

- Existing `game:state-update` payload already includes `events` with `type: "fish-eaten"`.
- Client-side handling will map `fish-eaten` events to the new crunch sound playback.
