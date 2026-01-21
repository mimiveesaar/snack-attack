export interface Position {
  x: number;
  y: number;
}

export const circleCollide = (pos1: Position, r1: number, pos2: Position, r2: number): boolean => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < r1 + r2;
};
