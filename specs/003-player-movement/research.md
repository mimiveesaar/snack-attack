# Research: Player Movement (Client)

## Decision 1: Fixed-timestep loop with accumulator
- **Decision**: Use a fixed timestep of 0.0167s (60 TPS) with an accumulator updated in `requestAnimationFrame`.
- **Rationale**: Fixed timesteps provide deterministic movement and consistent distance across variable frame rates; 60 TPS aligns with common display refresh and stable physics.
- **Alternatives considered**:
  - Variable timestep per frame (rejected: inconsistent speed and unstable feel).
  - Smaller fixed step (e.g., 0.0083s) (rejected: higher CPU cost with minimal benefit for this feature).

## Decision 2: Catch-up cap and frame time clamp
- **Decision**: Cap fixed updates per render to 5 steps and clamp a single frame’s delta to 0.25s.
- **Rationale**: Prevents “spiral of death” after long stalls while keeping movement consistent and responsive.
- **Alternatives considered**:
  - No cap (rejected: risk of long frames and input starvation).
  - Dropping all excess accumulated time (rejected: can cause visible teleporting).

## Decision 3: DOM-based rendering via transforms
- **Decision**: Render fish using DOM elements with `transform: translate(...)` updates; avoid layout thrash.
- **Rationale**: DOM transforms are compositor-friendly, align with Lit component model, and respect the no-canvas constraint.
- **Alternatives considered**:
  - Updating `top/left` per frame (rejected: reflow cost).
  - Canvas rendering (rejected: prohibited by constitution).

## Decision 4: Input handling
- **Decision**: Maintain a key state map updated by `keydown`/`keyup` for WASD and arrow keys; opposing inputs cancel on each axis.
- **Rationale**: Stable, deterministic inputs per fixed step and easy to network later by sharing input snapshots.
- **Alternatives considered**:
  - Using only `keydown` events (rejected: repeats vary by OS/browser).
  - Using pointer-based controls (rejected: not requested for this phase).
