export const darkColors = {

  background: '#0A0A0F',

  card: '#1E1E24',

  cardBorder: '#2A2A32',

  accent: '#3B82F6',

  accentMuted: '#2563EB',

  text: '#FFFFFF',

  textOnAccent: '#FFFFFF',

  textSecondary: '#9CA3AF',

  textMuted: '#6B7280',

  success: '#22C55E',

  danger: '#EF4444',

  warning: '#F59E0B',

  long: '#22C55E',

  short: '#EF4444',

} as const;



export const lightColors = {

  background: '#F3F4F6',

  card: '#FFFFFF',

  cardBorder: '#E5E7EB',

  accent: '#2563EB',

  accentMuted: '#1D4ED8',

  text: '#111827',

  textOnAccent: '#FFFFFF',

  textSecondary: '#4B5563',

  textMuted: '#6B7280',

  success: '#16A34A',

  danger: '#DC2626',

  warning: '#D97706',

  long: '#16A34A',

  short: '#DC2626',

} as const;



export type ThemeColors = typeof darkColors | typeof lightColors;



export const colors = darkColors;



export const spacing = {

  xs: 4,

  sm: 8,

  md: 16,

  lg: 24,

  xl: 32,

} as const;



export const radii = {

  sm: 8,

  md: 12,

  lg: 16,

  full: 999,

} as const;

