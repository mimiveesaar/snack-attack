import type { Vec2 } from '@shared/types/vec2';
import type { FishConfig } from './fish';

export interface FishMovementState {
  position: Vec2;
  velocity: Vec2;
  facingDirection: Vec2;
  wigglePhase: number;
}

const clampMagnitude = (value: Vec2, max: number): Vec2 => {
  const length = Math.hypot(value.x, value.y);
  if (length <= max || length === 0) {
    return value;
  }
  const scale = max / length;
  return { x: value.x * scale, y: value.y * scale };
};

const normalize = (value: Vec2): Vec2 => {
  const length = Math.hypot(value.x, value.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: value.x / length, y: value.y / length };
};

const scale = (value: Vec2, scalar: number): Vec2 => ({
  x: value.x * scalar,
  y: value.y * scalar,
});

const add = (left: Vec2, right: Vec2): Vec2 => ({
  x: left.x + right.x,
  y: left.y + right.y,
});

const subtract = (left: Vec2, right: Vec2): Vec2 => ({
  x: left.x - right.x,
  y: left.y - right.y,
});

const clampVerticalAngle = (direction: Vec2, fallbackX: number): Vec2 => {
  if (direction.x === 0 && direction.y === 0) {
    return direction;
  }

  let adjusted = { ...direction };
  if (adjusted.x === 0 && adjusted.y !== 0) {
    const horizontal = fallbackX === 0 ? 1 : Math.sign(fallbackX);
    adjusted = { x: horizontal, y: adjusted.y };
  }

  if (Math.abs(adjusted.y) > Math.abs(adjusted.x)) {
    adjusted = {
      x: adjusted.x,
      y: Math.sign(adjusted.y) * Math.abs(adjusted.x),
    };
  }

  return normalize(adjusted);
};

export const updateFishMovement = (
  state: FishMovementState,
  deltaSeconds: number,
  inputDirection: Vec2,
  config: FishConfig,
) => {
  const limitedInput = clampVerticalAngle(inputDirection, state.facingDirection.x);
  const hasInput = limitedInput.x !== 0 || limitedInput.y !== 0;

  if (hasInput) {
    const desiredVelocity = scale(limitedInput, config.maxSpeed);
    const difference = subtract(desiredVelocity, state.velocity);
    const maxChange = config.acceleration * deltaSeconds;
    const change = clampMagnitude(difference, maxChange);
    state.velocity = add(state.velocity, change);
  } else {
    const speed = Math.hypot(state.velocity.x, state.velocity.y);
    if (speed > 0) {
      const decel = Math.min(speed, config.drag * deltaSeconds);
      const nextSpeed = speed - decel;
      const direction = normalize(state.velocity);
      state.velocity = scale(direction, nextSpeed);
    }
  }

  state.velocity = clampMagnitude(state.velocity, config.maxSpeed);
  state.position = add(state.position, scale(state.velocity, deltaSeconds));

  if (hasInput) {
    state.facingDirection = limitedInput;
  } else if (Math.hypot(state.velocity.x, state.velocity.y) > 0.01) {
    state.facingDirection = normalize(state.velocity);
  }

  const wiggleIntensity = Math.min(1, Math.hypot(state.velocity.x, state.velocity.y) / config.maxSpeed);
  state.wigglePhase += deltaSeconds * config.wiggleSpeed * wiggleIntensity;
};

export const getFishRotation = (direction: Vec2) => Math.atan2(direction.y, direction.x);

export const getFishWiggleAngle = (wigglePhase: number, amplitude: number) =>
  Math.sin(wigglePhase) * amplitude;
