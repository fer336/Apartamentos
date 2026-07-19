import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone = "neutral" | "blue" | "green" | "red" | "yellow" | "violet";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "text-ink-secondary bg-surface-elevated border-border-subtle",
  blue: "text-state-blue bg-[rgba(118,102,154,0.14)] border-[rgba(118,102,154,0.28)]",
  green: "text-state-green-strong bg-[rgba(125,143,116,0.16)] border-[rgba(125,143,116,0.28)]",
  red: "text-state-red-strong bg-[rgba(166,77,69,0.14)] border-[rgba(166,77,69,0.28)]",
  yellow: "text-state-yellow bg-[rgba(212,178,111,0.16)] border-[rgba(212,178,111,0.28)]",
  violet: "text-state-violet bg-surface-violet border-[rgba(118,102,154,0.24)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** Small status pill used across tables, dashboard chips, property status, etc. */
export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    />
  );
}
