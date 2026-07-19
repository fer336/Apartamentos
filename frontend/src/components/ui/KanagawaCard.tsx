import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { DecorativeCardImage } from "./DecorativeCardImage";
import type { KanagawaArtworkComponent } from "../../theme/kanagawa-assets";

export type KanagawaCardTone = "default" | "blue" | "green" | "red" | "violet" | "gold";

const TONE_ACCENT: Record<KanagawaCardTone, string> = {
  default: "var(--border-strong)",
  blue: "var(--blue)",
  green: "var(--green)",
  red: "var(--red)",
  violet: "var(--violet)",
  gold: "var(--yellow)",
};

export interface KanagawaCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: KanagawaCardTone;
  artwork?: KanagawaArtworkComponent;
  padded?: boolean;
}

/**
 * Reusable card shell per spec section 11. Every stat/finance/property card
 * in the app should render through this component instead of a one-off
 * `bg-white rounded-2xl border ...` block, so the visual system stays
 * consistent and theme-reactive.
 */
export function KanagawaCard({
  tone = "default",
  artwork: Artwork,
  padded = true,
  className,
  style,
  children,
  ...rest
}: KanagawaCardProps) {
  return (
    <div
      className={cn("kanagawa-card", padded && "p-5", className)}
      style={{ ["--card-accent" as string]: TONE_ACCENT[tone], ...style }}
      {...rest}
    >
      {Artwork && <DecorativeCardImage artwork={Artwork} />}
      <div className="card-content">{children}</div>
    </div>
  );
}
