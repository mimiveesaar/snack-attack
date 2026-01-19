import type { Vec2 } from '@shared/types/vec2';

export interface FishConfig {
  maxSpeed: number;
  acceleration: number;
  drag: number;
  wiggleAmplitude: number;
  wiggleSpeed: number;
  spriteSrc: string;
}

export interface FishRenderState {
  position: Vec2;
  rotation: number;
  wiggleAngle: number;
  spriteSrc: string;
}

const DEFAULT_CONFIG: FishConfig = {
  maxSpeed: 220,
  acceleration: 620,
  drag: 420,
  wiggleAmplitude: 0.18,
  wiggleSpeed: 6,
  spriteSrc: '',
};

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

export class Fish {
  readonly id: string;
  position: Vec2;
  velocity: Vec2;
  facingDirection: Vec2;
  private wigglePhase = 0;
  private readonly config: FishConfig;

  constructor(id: string, position: Vec2, config: Partial<FishConfig>) {
    this.id = id;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.facingDirection = { x: 1, y: 0 };
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  update(deltaSeconds: number, inputDirection: Vec2) {
    const limitedInput = clampVerticalAngle(inputDirection, this.facingDirection.x);
    const hasInput = limitedInput.x !== 0 || limitedInput.y !== 0;

    if (hasInput) {
      const desiredVelocity = scale(limitedInput, this.config.maxSpeed);
      const difference = subtract(desiredVelocity, this.velocity);
      const maxChange = this.config.acceleration * deltaSeconds;
      const change = clampMagnitude(difference, maxChange);
      this.velocity = add(this.velocity, change);
    } else {
      const speed = Math.hypot(this.velocity.x, this.velocity.y);
      if (speed > 0) {
        const decel = Math.min(speed, this.config.drag * deltaSeconds);
        const nextSpeed = speed - decel;
        const direction = normalize(this.velocity);
        this.velocity = scale(direction, nextSpeed);
      }
    }

    this.velocity = clampMagnitude(this.velocity, this.config.maxSpeed);
    this.position = add(this.position, scale(this.velocity, deltaSeconds));

    if (hasInput) {
      this.facingDirection = limitedInput;
    } else if (Math.hypot(this.velocity.x, this.velocity.y) > 0.01) {
      this.facingDirection = normalize(this.velocity);
    }

    const wiggleIntensity = Math.min(1, Math.hypot(this.velocity.x, this.velocity.y) / this.config.maxSpeed);
    this.wigglePhase += deltaSeconds * this.config.wiggleSpeed * wiggleIntensity;
  }

  getRenderState(): FishRenderState {
    const rotation = Math.atan2(this.facingDirection.y, this.facingDirection.x);
    const wiggleAngle = Math.sin(this.wigglePhase) * this.config.wiggleAmplitude;
    return {
      position: { ...this.position },
      rotation,
      wiggleAngle,
      spriteSrc: this.config.spriteSrc,
    };
  }
}
