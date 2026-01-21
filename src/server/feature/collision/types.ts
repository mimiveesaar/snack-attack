export interface CollisionEvent {
  type: 'fish-eaten' | 'powerup-collected' | 'boundary-hit';
  tick: number;
  data: Record<string, any>;
}
