/**
 * Tailwind CSS configuration for Versa.
 *
 * Color values are kept in sync with src/lib/design-tokens.ts (canonical source).
 * If you update colors here, update design-tokens.ts to match.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Background tokens — design-tokens.ts: colors.bg
        versa: {
          bg: '#F5F4F8',
          surface: '#EDECF1',
          hover: '#EDEAF3',
          muted: '#E8E6EE',
        },
        // Primary accent — design-tokens.ts: colors.velvet
        velvet: {
          DEFAULT: '#69306D',
          light: '#A5668B',
          wash: '#F5E8EF',
          dim: '#F3E8F4',
          pressed: '#52254F',
        },
        // Semantic colors — design-tokens.ts: colors.coral/sage/sky/plum
        coral: {
          DEFAULT: '#F95738',
          light: '#FEF0EC',
        },
        sage: {
          DEFAULT: '#2CA58D',
          light: '#E6F6F2',
        },
        // Accent colors for avatars, badges, visual variety
        seagrass: { DEFAULT: '#2CA58D', dim: '#E6F6F2' },
        gold: { DEFAULT: '#F4D35E', dim: '#FDF8E6' },
        rose: { DEFAULT: '#F46197', dim: '#FEECF3' },
        sandy: { DEFAULT: '#EE964B', dim: '#FDF3E8' },
        steel: { DEFAULT: '#4A6FA5', dim: '#EDF2F9' },
        sky: {
          DEFAULT: '#4A6FA5',
          light: '#EDF2F9',
        },
        plum: {
          DEFAULT: '#69306D',
          light: '#F3E8F4',
        },
        // Typography colors — design-tokens.ts: colors.text
        ink: {
          DEFAULT: '#0E103D',
          body: '#2D2B4E',
          secondary: '#6B6889',
          muted: '#A09DB8',
        },
        // Border/divider tokens — design-tokens.ts: colors.border
        warm: {
          border: '#E2D8DC',
          'border-strong': '#D1C5CC',
          divider: '#EDE6E8',
          wood: '#C9A96E',
        },
        // Gray scale
        gray: {
          50: '#EDECF1',
          100: '#E8E6EE',
          200: '#E2D8DC',
          300: '#D1C5CC',
          400: '#A09DB8',
          500: '#6B6889',
          600: '#2D2B4E',
          700: '#2D2B4E',
          800: '#0E103D',
          900: '#0E103D',
        },
      },
      fontFamily: {
        'display': ['DMSans_700Bold'],
        'body': ['DMSans_400Regular'],
        'body-medium': ['DMSans_500Medium'],
        'body-semibold': ['DMSans_600SemiBold'],
        'body-bold': ['DMSans_700Bold'],
        'mono': ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
        sans: ['DMSans_400Regular', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
        'btn': '10px',
        'badge': '6px',
        '2xl': '14px',
        'xl': '10px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
