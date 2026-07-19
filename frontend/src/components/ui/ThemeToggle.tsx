import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { cn } from "../../utils/cn";

interface ThemeToggleProps {
  className?: string;
}

/** Dark/light theme switcher for the topbar (spec sections 3 and 10). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "kanagawa-dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={cn(
        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface text-ink-secondary transition-colors duration-fast ease-kanagawa hover:bg-surface-hover hover:text-ink-primary",
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={1.7} /> : <Moon className="h-4 w-4" strokeWidth={1.7} />}
    </button>
  );
}
