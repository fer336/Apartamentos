/**
 * Kanagawa design system — token contract.
 *
 * This file is the single TypeScript source of truth for the two supported
 * themes. The actual CSS custom properties live in `src/theme/theme.css`
 * (loaded from `src/index.css`) — these constants mirror those values for
 * places that need a JS-side color (inline SVG fills, chart colors, etc.)
 * instead of a CSS variable.
 *
 * Do not hardcode new hex values in components — either reference the CSS
 * variables (`var(--primary)`, `text-[var(--text-secondary)]`, …) or import
 * from here.
 */

export type AppTheme = "kanagawa-dark" | "kanagawa-light";

export const APP_THEME_STORAGE_KEY = "app-theme";

export const KANAGAWA_THEMES: readonly AppTheme[] = [
  "kanagawa-dark",
  "kanagawa-light",
];

export const kanagawaDarkPalette = {
  backgroundDeep: "#051120",
  background: "#081422",
  backgroundAlt: "#0c1928",

  surface: "#0e1b2b",
  surfaceElevated: "#1b2635",
  surfaceViolet: "#242238",
  surfaceHover: "#18212d",

  borderSubtle: "#243042",
  border: "#2a3544",
  borderStrong: "#334154",
  divider: "rgba(109, 103, 100, 0.22)",

  textPrimary: "#e6dec7",
  textSecondary: "#b9ad99",
  textMuted: "#7f8083",
  textVioletSoft: "#7f7b79",

  primary: "#76669a",
  primaryHover: "#8a7aad",
  primaryActive: "#635476",
  primarySoft: "#a495c2",
  primaryDark: "#4f4568",

  // Blue is not part of this palette — kept as an alias of `primary` (now
  // violet) so consumers keyed on `blue`/`violet` stay in sync.
  blue: "#76669a",
  cyan: "#8a6a4a",
  violet: "#76669a",
  green: "#7d9a67",
  greenStrong: "#5e7d50",
  red: "#c35f52",
  redStrong: "#b94f43",
  yellow: "#d4b26f",
  orange: "#c47b55",

  cta: "#b75345",
  ctaHover: "#c46150",
  ctaActive: "#9f4439",
} as const;

export const kanagawaLightPalette = {
  backgroundDeep: "#ece4d6",
  background: "#f7f3ea",
  backgroundAlt: "#f3eee3",

  surface: "#fffaf1",
  surfaceElevated: "#f9f4eb",
  surfaceViolet: "#e9edf1",
  surfaceHover: "#eee7dc",

  borderSubtle: "#e4dccf",
  border: "#d5ccbd",
  borderStrong: "#aab4c2",
  divider: "rgba(85, 97, 116, 0.18)",

  textPrimary: "#1e2733",
  textSecondary: "#3f4d5c",
  textMuted: "#6b7686",
  textVioletSoft: "#556174",

  primary: "#6d5d8a",
  primaryHover: "#5f5177",
  primaryActive: "#4f4364",
  primarySoft: "#8a7aa8",
  primaryDark: "#423653",

  blue: "#6d5d8a",
  cyan: "#7a5c3d",
  violet: "#6d5d8a",
  green: "#6b7c60",
  greenStrong: "#445938",
  red: "#a64d45",
  redStrong: "#8a3f38",
  yellow: "#b8935a",
  orange: "#b87a45",

  cta: "#a6614f",
  ctaHover: "#914f3f",
  ctaActive: "#7d4335",
} as const;

export type KanagawaPalette = Record<keyof typeof kanagawaDarkPalette, string>;

export const kanagawaPalettes: Record<AppTheme, KanagawaPalette> = {
  "kanagawa-dark": kanagawaDarkPalette,
  "kanagawa-light": kanagawaLightPalette,
};

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
} as const;

export const duration = {
  fast: "140ms",
  normal: "180ms",
  slow: "260ms",
} as const;

export const easeKanagawa = "cubic-bezier(0.22, 1, 0.36, 1)";

export const fontFamilies = {
  display: '"Cormorant Garamond", Georgia, serif',
  ui: '"Inter", "Manrope", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;
