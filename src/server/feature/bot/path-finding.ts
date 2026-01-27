import type { Vec2D } from '../../../shared/game';

export type Hazard = {
  position: Vec2D;
  hardRadius: number;
  influenceRadius: number;
  weight: number;
};

export type PathFindingOptions = {
  width: number;
  height: number;
  buffer: number;
  cellSize: number;
  maxIterations: number;
  allowDiagonal: boolean;
  hazardPenalty: number;
};

type GridNode = { x: number; y: number };

type Neighbor = { x: number; y: number; cost: number };

const ORTHO_NEIGHBORS: Neighbor[] = [
  { x: 1, y: 0, cost: 1 },
  { x: -1, y: 0, cost: 1 },
  { x: 0, y: 1, cost: 1 },
  { x: 0, y: -1, cost: 1 },
];

const DIAGONAL_NEIGHBORS: Neighbor[] = [
  ...ORTHO_NEIGHBORS,
  { x: 1, y: 1, cost: 1.4 },
  { x: 1, y: -1, cost: 1.4 },
  { x: -1, y: 1, cost: 1.4 },
  { x: -1, y: -1, cost: 1.4 },
];

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const distance = (a: Vec2D, b: Vec2D): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const nodeKey = (node: GridNode): string => `${node.x},${node.y}`;

const heuristic = (a: GridNode, b: GridNode): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const findPath = (
  start: Vec2D,
  goal: Vec2D,
  hazards: Hazard[],
  options: PathFindingOptions,
): Vec2D[] => {
  const gridWidth = Math.max(1, Math.floor((options.width - options.buffer * 2) / options.cellSize));
  const gridHeight = Math.max(1, Math.floor((options.height - options.buffer * 2) / options.cellSize));
  const maxX = gridWidth - 1;
  const maxY = gridHeight - 1;

  const toGrid = (pos: Vec2D): GridNode => {
    const x = clamp(Math.floor((pos.x - options.buffer) / options.cellSize), 0, maxX);
    const y = clamp(Math.floor((pos.y - options.buffer) / options.cellSize), 0, maxY);
    return { x, y };
  };

  const toWorld = (node: GridNode): Vec2D => ({
    x: options.buffer + node.x * options.cellSize + options.cellSize / 2,
    y: options.buffer + node.y * options.cellSize + options.cellSize / 2,
  });

  const startNode = toGrid(start);
  const goalNode = toGrid(goal);

  if (startNode.x === goalNode.x && startNode.y === goalNode.y) {
    return [goal];
  }

  const neighbors = options.allowDiagonal ? DIAGONAL_NEIGHBORS : ORTHO_NEIGHBORS;

  const hazardCost = (node: GridNode): number => {
    const point = toWorld(node);
    let cost = 0;
    for (const hazard of hazards) {
      const dist = distance(point, hazard.position);
      if (dist <= hazard.hardRadius) return Number.POSITIVE_INFINITY;
      if (dist <= hazard.influenceRadius) {
        const influence = 1 - dist / hazard.influenceRadius;
        cost += hazard.weight * influence;
      }
    }
    return cost;
  };

  const openSet = new Map<string, GridNode>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const startKey = nodeKey(startNode);
  openSet.set(startKey, startNode);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startNode, goalNode));

  let iterations = 0;

  while (openSet.size > 0 && iterations < options.maxIterations) {
    iterations += 1;

    let current: GridNode | null = null;
    let currentKey: string | null = null;
    let bestF = Number.POSITIVE_INFINITY;

    for (const [key, node] of openSet.entries()) {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
      if (score < bestF) {
        bestF = score;
        current = node;
        currentKey = key;
      }
    }

    if (!current || !currentKey) break;

    if (current.x === goalNode.x && current.y === goalNode.y) {
      const path: Vec2D[] = [];
      let traceKey: string | undefined = currentKey;
      while (traceKey) {
        const [x, y] = traceKey.split(',').map(Number);
        path.unshift(toWorld({ x, y }));
        traceKey = cameFrom.get(traceKey);
      }
      path.push(goal);
      return path;
    }

    openSet.delete(currentKey);

    for (const neighbor of neighbors) {
      const nextNode: GridNode = {
        x: current.x + neighbor.x,
        y: current.y + neighbor.y,
      };

      if (nextNode.x < 0 || nextNode.x > maxX || nextNode.y < 0 || nextNode.y > maxY) {
        continue;
      }

      const hazardPenalty = hazardCost(nextNode);
      if (!Number.isFinite(hazardPenalty)) continue;

      const nextKey = nodeKey(nextNode);
      const currentG = gScore.get(currentKey) ?? Number.POSITIVE_INFINITY;
      const tentativeG = currentG + neighbor.cost + hazardPenalty * options.hazardPenalty;

      if (tentativeG < (gScore.get(nextKey) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(nextKey, currentKey);
        gScore.set(nextKey, tentativeG);
        fScore.set(nextKey, tentativeG + heuristic(nextNode, goalNode));
        if (!openSet.has(nextKey)) {
          openSet.set(nextKey, nextNode);
        }
      }
    }
  }

  return [];
};
