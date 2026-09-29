const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Geist (Google Fonts), loaded via @expo-google-fonts/geist + useFonts in app/_layout.tsx —
      // each weight registers under its own family name (e.g. "Geist_400Regular"), same pattern
      // this project used for IBM Plex Sans before the brief Segoe UI system-font detour.
      //
      // WEIGHT SCALE — three weights only; Medium (500) is deliberately not available.
      //   font-sans / font-plex-regular (400) — the default: body copy, table cells, list and
      //     menu items, inactive nav, links, status pills.
      //   font-plex-semibold (600) — emphasis: buttons, tabs, active nav, table column
      //     headers, section rows, totals, amounts.
      //   font-plex-bold (700) — headings only: page titles, card/dialog headings, headline
      //     stat figures.
      fontFamily: {
        sans: ['Geist_400Regular', 'system-ui', '-apple-system', 'sans-serif'],
        'plex-regular': ['Geist_400Regular', 'system-ui', '-apple-system', 'sans-serif'],
        'plex-semibold': ['Geist_600SemiBold', 'system-ui', '-apple-system', 'sans-serif'],
        'plex-bold': ['Geist_700Bold', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          text: 'hsl(var(--destructive-text))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          text: 'hsl(var(--success-text))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          hover: 'hsl(var(--brand-hover))',
          subtle: 'hsl(var(--brand-subtle))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          text: 'hsl(var(--warning-text))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
