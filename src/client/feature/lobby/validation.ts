const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;

export function validateNickname(nickname: string): { valid: boolean; message?: string } {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, message: 'Nickname is required' };
  }
  if (nickname.length > 31) {
    return { valid: false, message: 'Nickname must be under 32 characters' };
  }
  if (!NICKNAME_REGEX.test(nickname)) {
    return { valid: false, message: 'Use letters and numbers only' };
  }
  return { valid: true };
}

export const palette = [
  '#7fb18d',
  '#78a9d1',
  '#f2c57c',
  '#d98b8b',
  '#b07bac',
  '#8c9ec7',
];

export function isPaletteColor(color: string): boolean {
  return palette.includes(color);
}
