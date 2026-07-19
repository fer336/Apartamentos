/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Kanagawa violet — replaces the old lila/púrpura "brand" scale.
        // Kept as a static reference scale (design-time use, e.g. gradients)
        // while the semantic tokens below are the ones components use.
        brand: {
          50: '#f0e9f5',
          100: '#e1d3ea',
          200: '#c3abdf',
          300: '#a28bc0',
          400: '#957fb8',
          500: '#8067a8',
          600: '#685496',
          700: '#574582',
          800: '#4b3869',
          900: '#383058',
          950: '#191727',
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        input: "var(--surface)",
        ring: "var(--primary-soft)",
        background: {
          DEFAULT: "var(--background)",
          deep: "var(--background-deep)",
          alt: "var(--background-alt)",
        },
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          soft: "var(--primary-soft)",
          dark: "var(--primary-dark)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--red)",
          foreground: "var(--primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--background-alt)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--surface-violet)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-primary)",
        },
        // Kanagawa surfaces / text / semantic state colors, exposed as
        // first-class Tailwind utilities (bg-surface-elevated, text-ink-muted,
        // bg-state-green/15, …) so pages don't need arbitrary var() classes.
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          violet: "var(--surface-violet)",
          hover: "var(--surface-hover)",
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          violet: "var(--text-violet-soft)",
        },
        state: {
          blue: "var(--blue)",
          cyan: "var(--cyan)",
          violet: "var(--violet)",
          green: "var(--green)",
          "green-strong": "var(--green-strong)",
          red: "var(--red)",
          "red-strong": "var(--red-strong)",
          yellow: "var(--yellow)",
          orange: "var(--orange)",
        },
        cta: {
          DEFAULT: "var(--cta)",
          hover: "var(--cta-hover)",
          active: "var(--cta-active)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
      },
      spacing: {
        18: "var(--space-8)",
      },
      transitionDuration: {
        fast: "140ms",
        normal: "180ms",
        slow: "260ms",
      },
      transitionTimingFunction: {
        kanagawa: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        card: '0 18px 44px rgba(3,4,17,.18)',
        'card-hover': '0 20px 48px rgba(3,4,17,.26)',
        'btn-primary': '0 8px 22px rgba(44,31,69,.24)',
      },
      animation: {
        "in": "in 0.26s var(--ease-kanagawa)",
        "fade-in": "fade-in 0.26s var(--ease-kanagawa)",
      },
      keyframes: {
        "in": {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
