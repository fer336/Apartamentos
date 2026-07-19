import { kanagawaAssets } from "../../theme/kanagawa-assets";
import type { AppTheme } from "../../theme/kanagawa-tokens";

interface KanagawaBackgroundProps {
  theme: AppTheme;
}

/**
 * Fixed, full-viewport decorative background per spec section 8. Swaps
 * between a desktop and a portrait-cropped asset via CSS media queries
 * (mirroring the spec's <picture>/<source> approach) and never intercepts
 * pointer events.
 */
export function KanagawaBackground({ theme }: KanagawaBackgroundProps) {
  const isDark = theme === "kanagawa-dark";
  const Desktop = isDark ? kanagawaAssets.background.dark : kanagawaAssets.background.light;
  const Mobile = isDark ? kanagawaAssets.background.darkMobile : kanagawaAssets.background.lightMobile;

  return (
    <div aria-hidden="true" className="kanagawa-background">
      <Desktop className="hidden h-full w-full md:block" />
      <Mobile className="block h-full w-full md:hidden" />
    </div>
  );
}
