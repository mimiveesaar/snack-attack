# Research: Initial Game View (Background & Atmosphere)

## Deterministic Seeded Layout

**Decision**: Accept a string seed from `?seed=` and normalize it before hashing into a 32-bit state used by a small integer PRNG (no dependencies).
- **Rationale**: Allows human-readable seeds, avoids locale differences, and yields deterministic results across browsers with minimal code.
- **Alternatives considered**: Numeric-only seeds (simpler but less shareable), external PRNG libraries (violates minimal dependency principle).

**Decision**: Keep randomness in integer space and only convert to floats at the final output step.
- **Rationale**: Bitwise integer operations are deterministic across JS engines; reduces cross-browser drift.
- **Alternatives considered**: Floating-point state updates (risk subtle inconsistencies).

**Decision**: Generate layout as a pure function of seed and fixed layout parameters, avoiding time, viewport size variance, or DOM measurement in the generator.
- **Rationale**: Ensures the same seed produces the same map on all clients.
- **Alternatives considered**: Viewport-dependent randomness (less consistent across clients).

**Decision**: Separate deterministic streams for independent element categories (rocks, seaweed, bubbles).
- **Rationale**: Changing one category’s rules won’t reshuffle the entire map.
- **Alternatives considered**: Single stream consumption (simpler but brittle to refactors).

## Ambient Animation (DOM-based, no canvas)

**Decision**: Use CSS animations for bubble rise motion, limited to `transform` and `opacity`.
- **Rationale**: CSS animations are optimized by the browser and avoid layout/paint thrash.
- **Alternatives considered**: Web Animations API (more control but extra complexity for a simple ambient effect).

**Decision**: Precompute bubble timing values from the seed and apply them as CSS custom properties.
- **Rationale**: Preserves deterministic motion across clients while staying CSS-driven.
- **Alternatives considered**: Runtime randomness per bubble (breaks determinism).
