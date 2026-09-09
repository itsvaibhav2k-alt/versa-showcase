/**
 * Versa Design Tokens
 *
 * Single source of truth for all design values in the app.
 * All components should import from here instead of hardcoding values.
 */

/** Background colors */
const bg = {
  deep: '#F5F4F8',
  surface: '#EDECF1',
  card: '#FFFFFF',
  hover: '#EDEAF3',
  muted: '#E8E6EE',
  lavVeil: '#F2D7EE',
} as const;

/** Primary accent -- velvet */
const velvet = {
  DEFAULT: '#69306D',
  light: '#A5668B',
  wash: '#F5E8EF',
  dim: '#F3E8F4',
  pressed: '#52254F',
} as const;

/** Secondary accent -- coral (urgency/errors) */
const coral = {
  DEFAULT: '#F95738',
  light: '#FEF0EC',
} as const;

/** Semantic -- sage / seagrass (success) */
const sage = {
  DEFAULT: '#2CA58D',
  light: '#E6F6F2',
} as const;

/** Semantic -- sky (info) */
const sky = {
  DEFAULT: '#4A6FA5',
  light: '#EDF2F9',
} as const;

/** Semantic -- plum (AI features) */
const plum = {
  DEFAULT: '#69306D',
  light: '#F3E8F4',
} as const;

/** Text colors */
const text = {
  primary: '#0E103D',
  body: '#2D2B4E',
  secondary: '#6B6889',
  muted: '#A09DB8',
  onVelvet: '#FFFFFF',
} as const;

/** Border and divider colors */
const border = {
  DEFAULT: '#E2D8DC',
  strong: '#D1C5CC',
  divider: '#EDE6E8',
} as const;

/** Status colors for dots, indicators, and priority markers */
const status = {
  urgent: '#F95738',
  high: '#EE964B',
  medium: '#4A6FA5',
  low: '#A09DB8',
  done: '#2CA58D',
  inProgress: '#4A6FA5',
  blocked: '#F95738',
  todo: '#A09DB8',
} as const;

/** Accent colors for avatars, badges, and visual variety */
const accent = {
  seagrass: '#2CA58D',
  seagrassDim: '#E6F6F2',
  coral: '#F95738',
  coralDim: '#FEF0EC',
  gold: '#F4D35E',
  goldDim: '#FDF8E6',
  rose: '#F46197',
  roseDim: '#FEECF3',
  sandy: '#EE964B',
  sandyDim: '#FDF3E8',
  steel: '#4A6FA5',
  steelDim: '#EDF2F9',
} as const;

/**
 * Member avatar color rotation.
 * Assign by index or stable hash of member ID for consistent colors.
 */
export const MEMBER_COLORS = [
  '#69306D', // velvet purple
  '#2CA58D', // seagrass teal
  '#F95738', // coral red-orange
  '#F4D35E', // royal gold — use #0E103D for text
  '#4A6FA5', // steel blue
  '#F46197', // rose pink
  '#EE964B', // sandy amber
  '#A5668B', // dusty lavender
] as const;

/** Get a stable member color based on their ID or array index */
export function getMemberColor(memberId: string, index?: number): string {
  if (index !== undefined) return MEMBER_COLORS[index % MEMBER_COLORS.length];
  const hash = memberId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}

/** Get the correct text color for a given member background color */
export function getMemberTextColor(bgColor: string): string {
  return bgColor === '#F4D35E' ? '#0E103D' : '#FFFFFF';
}

/**
 * Color tokens
 *
 * Organized by category. Use `colors.bg.deep` for the app background,
 * `colors.velvet.DEFAULT` for the primary accent, etc.
 */
export const colors = {
  bg,
  velvet,
  coral,
  sage,
  sky,
  plum,
  text,
  border,
  status,
  accent,
} as const;

/**
 * Typography presets
 *
 * Each preset includes fontSize, fontWeight, lineHeight, fontFamily,
 * and optional letterSpacing / textTransform.
 */
export const typography = {
  displayLg: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 40,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
  },
  displayMd: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 32,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.3,
  },
  headingLg: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontFamily: 'DMSans_600SemiBold',
  },
  headingMd: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 23,
    fontFamily: 'DMSans_600SemiBold',
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 25,
    fontFamily: 'DMSans_400Regular',
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  monoLg: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily: 'JetBrainsMono_600SemiBold',
  },
  monoMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: 'JetBrainsMono_400Regular',
  },
} as const;

/**
 * Spacing scale (4px base grid)
 *
 * Use `space[4]` for 16px, `space[8]` for 32px, etc.
 */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/**
 * Border radius values
 */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

/**
 * Shadow presets
 *
 * Uses cool-tinted shadows, not pure black.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#0E103D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#0E103D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#0E103D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: '#0E103D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  fab: {
    shadowColor: '#69306D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

/**
 * Animation presets
 */
export const animation = {
  press: {
    scale: 0.98,
    duration: 100,
  },
  fabPress: {
    scale: 0.92,
    duration: 100,
  },
  fadeIn: {
    duration: 200,
    delay: 0,
  },
  stagger: {
    duration: 200,
    delayPerItem: 40,
  },
  slideUp: {
    translateY: 12,
    duration: 200,
  },
  spring: {
    damping: 80,
    stiffness: 200,
  },
} as const;
