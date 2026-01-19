import { bubbleAssets, rockAssets, seaweedAssets, terrainDirtAssets, terrainSandAssets } from './game-assets';
import { createPrng, hashSeedToUint32, randomBetween, randomInt } from '../../../utils/prng';
import type { BubbleLayout, GameLayout, RockLayout, SeaweedLayout } from './layout-types';

// Fixed viewport dimensions matching the game view container.
export const VIEWPORT_WIDTH = 900;
export const VIEWPORT_HEIGHT = 540;

// Baseline for terrain and element placement within the scene.
const GROUND_Y = Math.floor(VIEWPORT_HEIGHT * 0.82);
const WATER_TOP = 24;

// Size ranges keep scaling in a visually consistent band.
const ROCK_SIZE_RANGE: [number, number] = [1, 3];
const SEAWEED_SIZE_RANGE: [number, number] = [1, 3];
const BUBBLE_SIZE_RANGE: [number, number] = [0.4, 1.1];

// Element counts tuned for a lively but uncluttered scene.
const ROCK_COUNT_RANGE: [number, number] = [6, 10];
const SEAWEED_COUNT_RANGE: [number, number] = [10, 16];
const BUBBLE_COUNT_RANGE: [number, number] = [18, 28];

const bubbleTiming = (prng: () => number) => ({
  durationMs: Math.round(randomBetween(prng, 3500, 9000)),
  delayMs: Math.round(randomBetween(prng, 0, 2200)),
  startYOffset: Math.round(randomBetween(prng, 0, 40)),
  endYOffset: Math.round(randomBetween(prng, 40, 160)),
});

const uniqueId = (prefix: string, index: number) => `${prefix}-${index}`;

export function generateLayout(seed: string): GameLayout {
  const terrainSeed = hashSeedToUint32(`${seed}:terrain`);
  const rockSeed = hashSeedToUint32(`${seed}:rocks`);
  const seaweedSeed = hashSeedToUint32(`${seed}:seaweed`);
  const bubbleSeed = hashSeedToUint32(`${seed}:bubbles`);

  const terrainPrng = createPrng(terrainSeed);
  const rockPrng = createPrng(rockSeed);
  const seaweedPrng = createPrng(seaweedSeed);
  const bubblePrng = createPrng(bubbleSeed);

  const terrain = {
    dirtIndex: randomInt(terrainPrng, 0, terrainDirtAssets.length - 1),
    sandIndex: randomInt(terrainPrng, 0, terrainSandAssets.length - 1),
  };

  const rockCount = randomInt(rockPrng, ROCK_COUNT_RANGE[0], ROCK_COUNT_RANGE[1]);
  const seaweedCount = randomInt(seaweedPrng, SEAWEED_COUNT_RANGE[0], SEAWEED_COUNT_RANGE[1]);
  const bubbleCount = randomInt(bubblePrng, BUBBLE_COUNT_RANGE[0], BUBBLE_COUNT_RANGE[1]);

  const rocks: RockLayout[] = Array.from({ length: rockCount }, (_, index) => ({
    id: uniqueId('rock', index),
    type: 'rock',
    position: {
      x: Math.round(randomBetween(rockPrng, 40, VIEWPORT_WIDTH - 80)),
      y: Math.round(randomBetween(rockPrng, GROUND_Y, GROUND_Y + 12)),
    },
    size: Number(randomBetween(rockPrng, ROCK_SIZE_RANGE[0], ROCK_SIZE_RANGE[1]).toFixed(2)),
    variantIndex: randomInt(rockPrng, 0, rockAssets.length - 1),
  }));

  const seaweed: SeaweedLayout[] = Array.from({ length: seaweedCount }, (_, index) => ({
    id: uniqueId('seaweed', index),
    type: 'seaweed',
    position: {
      x: Math.round(randomBetween(seaweedPrng, 30, VIEWPORT_WIDTH - 60)),
      y: Math.round(randomBetween(seaweedPrng, GROUND_Y, GROUND_Y + 16)),
    },
    size: Number(randomBetween(seaweedPrng, SEAWEED_SIZE_RANGE[0], SEAWEED_SIZE_RANGE[1]).toFixed(2)),
    variantIndex: randomInt(seaweedPrng, 0, seaweedAssets.length - 1),
  }));

  const bubbles: BubbleLayout[] = Array.from({ length: bubbleCount }, (_, index) => {
    const timing = bubbleTiming(bubblePrng);
    return {
      id: uniqueId('bubble', index),
      type: 'bubble',
      position: {
        x: Math.round(randomBetween(bubblePrng, 20, VIEWPORT_WIDTH - 20)),
        y: Math.round(randomBetween(bubblePrng, GROUND_Y - 20, VIEWPORT_HEIGHT - 12)),
      },
      size: Number(randomBetween(bubblePrng, BUBBLE_SIZE_RANGE[0], BUBBLE_SIZE_RANGE[1]).toFixed(2)),
      variantIndex: randomInt(bubblePrng, 0, bubbleAssets.length - 1),
      ...timing,
    };
  });

  return {
    seed,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    terrain,
    rocks,
    seaweed,
    bubbles,
  };
}
