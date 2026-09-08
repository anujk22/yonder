export const brand = {
  oat: '#F5D547',
  espresso: '#242A22',
  fern: '#52745C',
} as const;

export const ask = {
  bg: '#F8F7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EDE2',
  ink: '#243C32',
  inkSoft: '#60665B',
  inkFaint: '#73796E',
  border: '#DDDFD4',
  accent: '#F5D547',
  accentSoft: '#F8ECA9',
  onAccent: '#242A22',
  fresh: '#386448',
  aging: '#B07A2E',
  stale: '#A2937D',
  danger: '#B4453C',
  scrim: 'rgba(36, 28, 18, 0.52)',
  glass: 'rgba(255, 252, 246, 0.76)',
  transparent: 'rgba(0, 0, 0, 0)',
  shadow: '#342617',
} as const;

export const observe = {
  bg: '#242A22',
  surface: '#30382D',
  surfaceAlt: '#3B4435',
  ink: '#F7F7F0',
  inkSoft: '#C5CEBC',
  inkFaint: '#A1AC97',
  border: '#515B48',
  accent: '#F5D547',
  accentSoft: '#48472C',
  onAccent: '#242A22',
  fresh: '#6FCB7F',
  aging: '#E0A24E',
  stale: '#7A6B55',
  danger: '#E07A6E',
  scrim: 'rgba(30, 24, 16, 0.72)',
  glass: 'rgba(36, 28, 18, 0.86)',
  transparent: 'rgba(0, 0, 0, 0)',
  shadow: '#1E1810',
} as const;

export type AppTheme = typeof ask | typeof observe;

export const radii = { small: 12, card: 18, sheet: 28, pill: 999 } as const;
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const font = {
  serif: 'Fraunces_600SemiBold',
  serifMedium: 'Fraunces_500Medium',
  italic: 'Fraunces_500Medium_Italic',
  display600: 'Manrope_600SemiBold',
  display700: 'Manrope_700Bold',
  black: 'Fraunces_700Bold',
  ui400: 'Manrope_400Regular',
  ui500: 'Manrope_500Medium',
  ui600: 'Manrope_600SemiBold',
  ui700: 'Manrope_700Bold',
  mono400: 'JetBrainsMono_400Regular',
  mono500: 'JetBrainsMono_500Medium',
} as const;

export const type = {
  serifDisplay: { fontFamily: font.serif, fontSize: 52, lineHeight: 51, letterSpacing: -0.9 },
  serifTitle: { fontFamily: font.serif, fontSize: 38, lineHeight: 40, letterSpacing: -0.55 },
  serifHeading: { fontFamily: font.serif, fontSize: 26, lineHeight: 30, letterSpacing: -0.25 },
  serifMediumHeading: { fontFamily: font.serifMedium, fontSize: 26, lineHeight: 30, letterSpacing: -0.25 },
  display: { fontFamily: font.display700, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  title: { fontFamily: font.display700, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  heading: { fontFamily: font.display600, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontFamily: font.ui400, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: font.ui500, fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
  micro: { fontFamily: font.ui600, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono: { fontFamily: font.mono400, fontSize: 14, lineHeight: 20 },
  monoBig: { fontFamily: font.mono500, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
} as const;
