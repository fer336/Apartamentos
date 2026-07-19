/* eslint-disable react-refresh/only-export-components -- this is a data
   registry module (paths + tiny placeholder artwork), not a component file;
   Fast Refresh optimization doesn't apply here. */
/**
 * Central Kanagawa asset registry.
 *
 * The design spec (prompt-rediseño-sistema-propiedades-kanagawa.md, section 7)
 * calls for real PNG photography under `public/assets/kanagawa/...`. Most of
 * those slots now have a real photo (resized + palette-reduced with
 * ImageMagick to stay under ~300KB each) and are wired in via `realImage()`.
 * The one slot nobody delivered a photo for (`cards.incomePines`) still falls
 * back to the original inline-SVG placeholder — simple, abstract line-art
 * evoking the same motif the spec describes, at the same low opacity a real
 * photo would use, never an attempt at a photorealistic substitute.
 *
 * TO SWAP IN A REAL PHOTO FOR A REMAINING PLACEHOLDER:
 * 1. Drop the PNG into `public/assets/kanagawa/...` following the spec's path.
 * 2. Replace that entry below with `realImage("/assets/kanagawa/...png")`.
 * Nothing else changes — `KanagawaBackground` and `DecorativeCardImage` only
 * ever consume `kanagawaAssets.*` by key through the shared
 * `KanagawaArtworkComponent` contract, never a hardcoded path.
 */
import type { CSSProperties, FC } from "react";
import type { AppTheme } from "./kanagawa-tokens";

export interface KanagawaArtworkProps {
  className?: string;
  style?: CSSProperties;
}

export type KanagawaArtworkComponent = FC<KanagawaArtworkProps>;

/** Wraps a real photo so it satisfies the same component contract as the SVG placeholders. */
export function realImage(src: string): KanagawaArtworkComponent {
  const RealImage: KanagawaArtworkComponent = ({ className, style }) => (
    <img
      src={src}
      alt=""
      draggable={false}
      className={className}
      style={{ objectFit: "cover", objectPosition: "center", ...style }}
    />
  );
  return RealImage;
}

/** Pines motif — income / positive category icon artwork. */
const CardIncomePines: KanagawaArtworkComponent = (props) => (
  <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" fill="none" {...props}>
    <path d="M150 60 L200 150 L100 150 Z" fill="var(--green)" opacity="0.55" />
    <path d="M150 110 L210 210 L90 210 Z" fill="var(--green)" opacity="0.45" />
    <rect x="138" y="210" width="24" height="40" fill="var(--green-strong)" opacity="0.4" />
  </svg>
);

export const kanagawaAssets = {
  background: {
    dark: realImage("/assets/kanagawa/backgrounds/dashboard-dark.png"),
    light: realImage("/assets/kanagawa/backgrounds/dashboard-light.png"),
    darkMobile: realImage("/assets/kanagawa/backgrounds/dashboard-dark-mobile.png"),
    lightMobile: realImage("/assets/kanagawa/backgrounds/dashboard-light-mobile.png"),
    sidebarDark: realImage("/assets/kanagawa/backgrounds/sidebar-dark.png"),
    sidebarLight: realImage("/assets/kanagawa/backgrounds/sidebar-light.png"),
  },

  cards: {
    pesos: realImage("/assets/kanagawa/cards/pesos-blue.png"),
    dolares: realImage("/assets/kanagawa/cards/dolares-green.png"),
    resultado: realImage("/assets/kanagawa/cards/resultado-red.png"),
    incomePines: CardIncomePines,
    expenseFuji: realImage("/assets/kanagawa/cards/expense-fuji.png"),
    propertyLandscape: {
      dark: realImage("/assets/kanagawa/cards/property-landscape.png"),
      light: realImage("/assets/kanagawa/cards/property-landscape-light.png"),
    },
  },

  /**
   * Dashboard KPI stat cards + Vista operativa cards (section: Inicio).
   * Each slot has a dark/light pair so callers pick the right one for the
   * active theme (see `pickKpiArtwork`).
   */
  kpi: {
    income: { dark: realImage("/assets/kanagawa/decorative/pines.png"), light: realImage("/assets/kanagawa/decorative/pines-light.png") },
    occupancy: { dark: realImage("/assets/kanagawa/decorative/red.png"), light: realImage("/assets/kanagawa/decorative/red-light.png") },
    bookings: { dark: realImage("/assets/kanagawa/decorative/wave.png"), light: realImage("/assets/kanagawa/decorative/wave-light.png") },
    receivables: { dark: realImage("/assets/kanagawa/decorative/fuji.png"), light: realImage("/assets/kanagawa/decorative/fuji-light.png") },
    checkin: { dark: realImage("/assets/kanagawa/decorative/pines.png"), light: realImage("/assets/kanagawa/decorative/pines-light.png") },
    checkout: { dark: realImage("/assets/kanagawa/decorative/red.png"), light: realImage("/assets/kanagawa/decorative/red-light.png") },
  },
} as const;

export type KanagawaBackgroundKey = keyof typeof kanagawaAssets.background;
export type KanagawaCardArtworkKey = keyof typeof kanagawaAssets.cards;
export type KanagawaKpiArtworkKey = keyof typeof kanagawaAssets.kpi;

/** Picks the dark/light variant of a `{ dark, light }` artwork pair for the active theme. */
export function pickThemedArtwork(
  pair: { dark: KanagawaArtworkComponent; light: KanagawaArtworkComponent },
  theme: AppTheme
): KanagawaArtworkComponent {
  return pair[theme === "kanagawa-light" ? "light" : "dark"];
}

/** Picks the dark/light variant of a `kanagawaAssets.kpi.*` entry for the active theme. */
export function pickKpiArtwork(key: KanagawaKpiArtworkKey, theme: AppTheme): KanagawaArtworkComponent {
  return pickThemedArtwork(kanagawaAssets.kpi[key], theme);
}

/** Shared style so every decorative asset is unmistakably non-interactive. */
export const decorativeArtworkStyle: CSSProperties = {
  pointerEvents: "none",
  userSelect: "none",
};
