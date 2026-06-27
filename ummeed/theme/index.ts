/**
 * Ummeed design tokens.
 * Accessibility-first: high contrast, large readable type, generous spacing.
 * Palette inspired by a warm sunrise on deep teal — "hope after the night".
 */
export const colors = {
  // Brand
  bg: '#FFF8F0',          // warm off-white background
  surface: '#FFFFFF',
  surfaceAlt: '#FDEFE0',  // peach surface for cards
  primary: '#0F3D3E',     // deep teal (calm, healing)
  primaryDark: '#0A2B2C',
  primarySoft: '#1E5F61',
  accent: '#E07A2C',      // warm saffron (hope)
  accentDark: '#B85F1C',
  // Text
  text: '#0E1B1F',        // near-black, very high contrast on bg
  textMuted: '#3F5560',
  textInverse: '#FFFFFF',
  // States
  success: '#2E7D32',
  danger: '#B3261E',
  warning: '#C77700',
  info: '#1E5F61',
  // Lines
  border: '#D9C6B0',
  borderStrong: '#0F3D3E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const font = {
  // Big & legible — important for low-vision users
  h1: 32,
  h2: 26,
  h3: 22,
  body: 18,
  small: 15,
  micro: 13,
  weightBold: '700' as const,
  weightSemi: '600' as const,
  weightReg: '400' as const,
};
