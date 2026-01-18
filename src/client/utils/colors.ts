// Player color options - must match available fish SVG assets
export const playerColors = [
  '#228B22',  // Green - fish_green
  '#FFA500',  // Yellow/Orange - fish_orange
  '#4169E1',  // Blue - fish_blue
  '#FF6347',  // Red - fish_red
];

// Map colors to fish asset names
export const colorToFishAsset: Record<string, string> = {
  '#228B22': 'fish_green',
  '#FFA500': 'fish_orange',
  '#4169E1': 'fish_blue',
  '#FF6347': 'fish_red',
};

// Map colors to readable names
export const colorToName: Record<string, string> = {
  '#228B22': 'Green',
  '#FFA500': 'Yellow',
  '#4169E1': 'Blue',
  '#FF6347': 'Red',
};

export function pickDefaultColor(index = 0): string {
  return playerColors[index % playerColors.length];
}
