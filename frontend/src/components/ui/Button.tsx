import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "button-primary hover:-translate-y-px active:translate-y-0",
  secondary: "button-secondary hover:bg-surface-hover",
  danger: "button-danger hover:bg-[rgba(166,77,69,0.16)]",
  ghost: "text-ink-secondary hover:bg-surface-hover hover:text-ink-primary border border-transparent",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Section 20 button system — three tones, all reused via `variant`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-fast ease-kanagawa disabled:opacity-50 disabled:pointer-events-none",
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    />
  )
);
Button.displayName = "Button";
