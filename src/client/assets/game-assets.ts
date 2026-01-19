const asset = (path: string) => new URL(path, import.meta.url).toString();

export const terrainDirtAssets = [
  asset('../../assets/vector/terrain_dirt_a.svg'),
  asset('../../assets/vector/terrain_dirt_b.svg'),
  asset('../../assets/vector/terrain_dirt_c.svg'),
  asset('../../assets/vector/terrain_dirt_d.svg'),
];

export const terrainSandAssets = [
  asset('../../assets/vector/terrain_sand_a.svg'),
  asset('../../assets/vector/terrain_sand_b.svg'),
  asset('../../assets/vector/terrain_sand_c.svg'),
  asset('../../assets/vector/terrain_sand_d.svg'),
];

export const rockAssets = [
  asset('../../assets/vector/rock_a.svg'),
  asset('../../assets/vector/rock_b.svg'),
  asset('../../assets/vector/background_rock_a.svg'),
  asset('../../assets/vector/background_rock_b.svg'),
];

export const seaweedAssets = [
  asset('../../assets/vector/seaweed_green_a.svg'),
  asset('../../assets/vector/seaweed_green_b.svg'),
  asset('../../assets/vector/seaweed_green_c.svg'),
  asset('../../assets/vector/seaweed_green_d.svg'),
  asset('../../assets/vector/seaweed_grass_a.svg'),
  asset('../../assets/vector/seaweed_grass_b.svg'),
  asset('../../assets/vector/seaweed_orange_a.svg'),
  asset('../../assets/vector/seaweed_orange_b.svg'),
  asset('../../assets/vector/seaweed_pink_a.svg'),
  asset('../../assets/vector/seaweed_pink_b.svg'),
  asset('../../assets/vector/seaweed_pink_c.svg'),
  asset('../../assets/vector/seaweed_pink_d.svg'),
];

export const bubbleAssets = [
  asset('../../assets/vector/bubble_a.svg'),
  asset('../../assets/vector/bubble_b.svg'),
  asset('../../assets/vector/bubble_c.svg'),
];

export const fishAssets = [
  asset('../../assets/vector/fish_blue.svg'),
  asset('../../assets/vector/fish_green.svg'),
  asset('../../assets/vector/fish_orange.svg'),
  asset('../../assets/vector/fish_pink.svg'),
  asset('../../assets/vector/fish_red.svg'),
  asset('../../assets/vector/fish_grey.svg'),
  asset('../../assets/vector/fish_brown.svg'),
];

export const defaultFishAsset = fishAssets[0];
