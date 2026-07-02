// Central theme tokens for the app.
export const colors = {
  bg: '#0B1F17', // deep fairway green
  bgElevated: '#102B20',
  card: '#16382A',
  border: '#1F4D39',
  text: '#F4F8F5',
  textMuted: '#9CB7A8',
  primary: '#34C759', // golf-green accent
  primaryText: '#06210F',
  danger: '#FF6B6B',
  success: '#34C759',
  white: '#FFFFFF',
  black: '#0A0A0A',
  gold: '#FFD66B',
  whiteTee: '#E9EEF0',
  blackTee: '#222831',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  card: 18,
} as const;

// Width:height ratio of the supplied card artwork (696 × 1038). All card frames use this
// so the real images render without cropping or letterboxing.
export const CARD_RATIO = 696 / 1038;
