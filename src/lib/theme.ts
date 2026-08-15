export const brand = {
  oat: '#DEC9A3',
  espresso: '#3A2F20',
  fern: '#5FB14E',
} as const;

export const ask = {
  bg: '#F7F1E4',
  surface: '#FFFCF6',
  surfaceAlt: '#EDE3D0',
  ink: '#241C12',
  inkSoft: '#6B5D4A',
  inkFaint: '#A2937D',
  border: '#E0D4BE',
  accent: '#3A2F20',
  accentSoft: '#EDE3D0',
  onAccent: '#F7F1E4',
  fresh: '#3E8E4F',
  aging: '#B07A2E',
  stale: '#A2937D',
  danger: '#B4453C',
  scrim: 'rgba(36, 28, 18, 0.52)',
  glass: 'rgba(255, 252, 246, 0.76)',
  transparent: 'rgba(0, 0, 0, 0)',
  shadow: '#3A2F20',
} as const;

export const observe = {
  bg: '#1E1810',
  surface: '#2C2318',
  surfaceAlt: '#3A2F20',
  ink: '#F5EDDC',
  inkSoft: '#B5A48A',
  inkFaint: '#7A6B55',
  border: '#423528',
  accent: '#DEC9A3',
  accentSoft: '#3A2F20',
  onAccent: '#241C12',
  fresh: '#6FCB7F',
  aging: '#E0A24E',
  stale: '#7A6B55',
  danger: '#E07A6E',
  scrim: 'rgba(30, 24, 16, 0.72)',
  glass: 'rgba(44, 35, 24, 0.78)',
  transparent: 'rgba(0, 0, 0, 0)',
  shadow: '#1E1810',
} as const;

export type AppTheme = typeof ask | typeof observe;

export const radii = { small: 14, card: 22, sheet: 30, pill: 999 } as const;
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const font = {
  serif: 'DMSerifDisplay_400Regular',
  display600: 'SpaceGrotesk_600SemiBold',
  display700: 'SpaceGrotesk_700Bold',
  ui400: 'Inter_400Regular',
  ui500: 'Inter_500Medium',
  ui600: 'Inter_600SemiBold',
  mono400: 'JetBrainsMono_400Regular',
  mono500: 'JetBrainsMono_500Medium',
} as const;

export const type = {
  serifDisplay: { fontFamily: font.serif, fontSize: 48, lineHeight: 50, letterSpacing: -0.8 },
  serifTitle: { fontFamily: font.serif, fontSize: 36, lineHeight: 39, letterSpacing: -0.5 },
  serifHeading: { fontFamily: font.serif, fontSize: 26, lineHeight: 30, letterSpacing: -0.25 },
  display: { fontFamily: font.display700, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  title: { fontFamily: font.display700, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  heading: { fontFamily: font.display600, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontFamily: font.ui400, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: font.ui500, fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
  micro: { fontFamily: font.ui600, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono: { fontFamily: font.mono400, fontSize: 14, lineHeight: 20 },
  monoBig: { fontFamily: font.mono500, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
} as const;
