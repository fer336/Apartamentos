import type { KanagawaArtworkComponent } from "../../theme/kanagawa-assets";
import { cn } from "../../utils/cn";

interface DecorativeCardImageProps {
  /** One entry from `kanagawaAssets.cards.*` — a real photo today for most
   * slots, an inline SVG placeholder for the couple still pending. */
  artwork: KanagawaArtworkComponent;
  className?: string;
}

/**
 * Decorative, non-interactive artwork positioned inside a KanagawaCard per
 * spec section 12 (`.card-artwork`): bottom-right, masked fade-in from the
 * left, low opacity, never intercepts pointer events or gets exposed to
 * assistive tech.
 */
export function DecorativeCardImage({ artwork: Artwork, className }: DecorativeCardImageProps) {
  return (
    <div className={cn("card-artwork", className)} aria-hidden="true">
      <Artwork className="h-full w-full" style={{ pointerEvents: "none", userSelect: "none" }} />
    </div>
  );
}
