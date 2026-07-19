import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Empty-state block per spec section 17: quiet, low-opacity illustration
 * area, never bright/neon. `icon` is expected to be a lucide-react icon or a
 * decorative Kanagawa artwork component — kept generic so callers can pass
 * either.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}>
      {icon && <div className="text-ink-muted opacity-60">{icon}</div>}
      <p className="font-display text-lg font-semibold text-ink-primary">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
