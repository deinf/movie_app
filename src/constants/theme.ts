export const Colors = {
  background: '#070A0F',
  surface: '#131A24',
  surfaceElevated: '#1B2431',
  surfacePressed: '#243040',
  border: '#222D3D',

  primary: '#2F86F6',
  primaryLight: '#5AA6FF',
  // primary is only 3.58:1 under white text; these two clear 4.5:1
  primaryStrong: '#2571D0',
  primaryDeep: '#134B8F',
  primarySoft: 'rgba(47,134,246,0.14)',

  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textTertiary: '#7D8CA1',

  rating: '#F5C518',
} as const;

export const Scrim = {
  thumb: 'rgba(7,10,15,0.30)',
  banner: 'rgba(7,10,15,0.55)',
  control: 'rgba(7,10,15,0.60)',
  backdrop: 'rgba(7,10,15,0.60)',
  badge: 'rgba(7,10,15,0.80)',
  panel: 'rgba(19,26,36,0.82)',
  header: 'rgba(7,10,15,0.94)',
  textShadow: 'rgba(0,0,0,0.60)',
} as const;

export const Glass = {
  fill: 'rgba(255,255,255,0.16)',
  border: 'rgba(255,255,255,0.40)',
  accentFill: 'rgba(47,134,246,0.32)',
} as const;

export const Gradients = {
  primary: [Colors.primaryStrong, Colors.primaryDeep] as const,
  heroFade: ['transparent', 'rgba(7,10,15,0.35)', 'rgba(7,10,15,0.85)', '#070A0F'] as const,
  heroTop: ['rgba(7,10,15,0.75)', 'transparent'] as const,
  card: ['transparent', 'rgba(7,10,15,0.9)'] as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const Typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  section: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
} as const;

// rn 0.86 dropped absoluteFillObject, and absoluteFill can't be spread into a StyleSheet entry
export const AbsoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

export const TabBarHeight = 64;

export const TapTarget = 44;

export const MaxContentWidth = 720;
