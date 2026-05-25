export const colors = {
  background: '#0D0C1A',   // deep night sky
  card:        '#171628',  // elevated card surface
  primary:     '#7C74FF',  // slightly brighter purple for dark-bg contrast
  primaryLight:'#1C1A35',  // dark primary tint (replaces #EEF0FF)
  primaryMid:  '#4D49B0',  // mid purple (replaces #C4C1FF)
  text:        '#EBE9FF',  // near-white with soft purple tint
  subtext:     '#7B79A0',  // muted purple-grey
  border:      '#252342',  // subtle dark border
  success:     '#4CAF82',
  warning:     '#F6A623',
  surface:     '#1E1C34',  // slightly elevated surface
  white:       '#FFFFFF',  // kept for text/icons on coloured backgrounds
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', color: colors.subtext },
  label: { fontSize: 12, fontWeight: '600', color: colors.subtext, letterSpacing: 0.5, textTransform: 'uppercase' },
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
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
};

export const shadow = {
  soft: {
    shadowColor: '#7C74FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,   // glow effect on dark bg
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
};
