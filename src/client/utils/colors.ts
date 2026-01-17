export const playerColors = [
  '#7fb18d',
  '#78a9d1',
  '#f2c57c',
  '#d98b8b',
  '#b07bac',
  '#8c9ec7',
];

export function pickDefaultColor(index = 0): string {
  return playerColors[index % playerColors.length];
}
