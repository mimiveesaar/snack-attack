# Feature Specification: Player Movement (Client)

**Feature Branch**: `001-player-movement`  
**Created**: 19 January 2026  
**Status**: Draft  
**Input**: User description: "Let's start implementing player movement for the fish game, currently keep everything on the client, but keep it mind it needs to be networked in the next step. Create a requestAnimationFrame based engine that ticks, To ensure movement happens at the same speed regardless of whether the hardware is running at 20 TPS or 200 TPS, you decouple logic from rendering. Create base fish.ts, base class for all fish. It is responsible for displaying the fish and its movement direction and other movement logic like wiggle and drag. Use Vec2 Velocity Keep in mind fish shouldn't move up and don't but dive at an 45 degree angle. Instead of moving \"per frame,\" you move in Fixed Timesteps (e.g., exactly 0.05s chunks). If a client lags, it accumulates \"missed time.\" When it recovers, it runs the physics loop multiple times in a single frame to \"catch up\" to the current time, ensuring it has traveled the same distance as everyone else. Player should be able to move with both WASD and arrow keys. Player should be handled by Client Controller. Player should use the underlaying fish.ts entity and apply controls to it."

## Clarifications

### Session 2026-01-19

- Q: What movement response model should the fish use (speed/acceleration/drag)? → A: Accelerate toward max speed with drag when no input.
- Q: How should fixed-step catch-up be bounded during long stalls? → A: Cap the number of catch-up steps per render frame.
- Q: What is the coordinate convention for vertical movement? → A: Up is positive Y; down is negative Y.
- Q: What fixed-step duration should be used for movement updates? → A: 0.0167s (60 TPS).
- Q: Can the player move upward? → A: Yes, upward movement is allowed.
- Q: Should the fish use existing visual assets? → A: Yes, use the provided assets.

## User Scenarios & Validation *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY VERIFIABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Verified independently through manual validation
  - Deployed independently
  - Demonstrated to users independently
  
  NOTE: This project prohibits automated testing. Validation scenarios describe manual verification steps.
-->

### User Story 1 - Move the fish avatar (Priority: P1)

As a player, I can move my fish using either WASD or arrow keys so I can actively control my avatar during gameplay.

**Why this priority**: Direct movement is the core interaction required to make the game playable.

**Manual Verification**: Start the client, press each directional key set (WASD and arrows), and observe that the fish responds immediately and moves in the expected direction.

**Acceptance Scenarios**:

1. **Given** the game is running, **When** the player holds the right arrow or D, **Then** the fish moves to the right and stops when the key is released.
2. **Given** the game is running, **When** the player holds left (A or left arrow) and right (D or right arrow) together, **Then** horizontal movement cancels and the fish does not drift horizontally.

---

### User Story 2 - Consistent movement across device speeds (Priority: P2)

As a player, my fish moves at the same speed regardless of the device’s frame rate so movement feels fair and predictable.

**Why this priority**: Fair movement speed across hardware is critical to gameplay balance.

**Manual Verification**: Run the game with a low and high frame rate (e.g., by throttling or heavy load) and compare the distance traveled in a fixed time interval.

**Acceptance Scenarios**:

1. **Given** two runs with different frame rates, **When** the player holds the same direction for 10 seconds, **Then** the final positions are within an acceptable tolerance.

---

### User Story 3 - Smooth recovery after lag (Priority: P3)

As a player, if my device lags briefly, my fish catches up smoothly so movement still reflects the time that passed.

**Why this priority**: Lag recovery keeps gameplay consistent and avoids unfair slowdowns.

**Manual Verification**: Trigger a brief stall (e.g., background tab or CPU spike), then observe that the fish quickly returns to the correct position without accelerating beyond its expected speed.

**Acceptance Scenarios**:

1. **Given** a brief stall during continuous movement, **When** the client recovers, **Then** the fish advances to the same position it would have reached without the stall.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Opposing directional inputs are held simultaneously (e.g., left+right or up+down).
- The client experiences a long frame stall and must process multiple fixed steps in one render.
- The player rapidly alternates between keys, testing responsiveness and drag behavior.
- The player attempts to move steeper than the allowed vertical angle.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The client MUST run a render loop based on time progression and advance movement using fixed time steps.
- **FR-002**: The movement update MUST process multiple fixed steps in a single render when accumulated time exceeds one step.
- **FR-002a**: The fixed-step duration MUST be 0.0167s (60 TPS).
- **FR-003**: The player MUST be able to move using both WASD and arrow keys with identical behavior.
- **FR-004**: The player controller MUST apply input to an underlying fish entity to drive its position, velocity, and facing direction.
- **FR-005**: The fish entity MUST maintain position and velocity as 2D vectors and expose its current movement direction.
- **FR-006**: Vertical movement MUST be limited to a maximum of 45° from horizontal in either direction.
- **FR-007**: Opposing inputs on the same axis MUST cancel movement along that axis.
- **FR-008**: Movement calculations MUST be deterministic per fixed time step to support future synchronization between clients.
- **FR-009**: The fish MUST accelerate toward a maximum speed while input is held and apply drag to decelerate when no input is present.
- **FR-010**: The engine MUST cap the number of fixed-step updates processed per render to prevent runaway catch-up.
- **FR-011**: The fish avatar MUST render using the provided fish assets.
- **FR-012**: Fish rendering MUST be implemented as a Lit component that receives render state updates from the movement system.
- **FR-013**: The fish sprite MUST mirror horizontally when moving left.
- **FR-014**: The fish sprite MUST tilt vertically to indicate upward/downward movement without full directional rotation.

### Assumptions

- This feature targets a single local player on the client for now.
- Movement occurs in a 2D plane and uses the on-screen notion of “up” and “down.”
- Coordinate system uses positive Y for up and negative Y for down.
- No persistence is required for movement state in this phase.

### Key Entities *(include if feature involves data)*

- **Fish Entity**: A movable avatar with position, velocity, facing direction, and movement behaviors (wiggle, drag).
- **Player Input State**: The current set of directional inputs affecting movement during each step.
- **Movement Step**: A fixed-duration update that advances movement deterministically.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: With continuous input for 10 seconds, the distance traveled at 20 FPS and 200 FPS differs by no more than 5%.
- **SC-002**: The fish begins moving within 100 ms of a valid movement key press.
- **SC-003**: Over a 10-second continuous input test, the fish never exceeds a 45° vertical angle.
- **SC-004**: After a 1-second render stall, the fish reaches the same position as an uninterrupted 10-second run within 1 second of recovery.
