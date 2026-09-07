import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "primary" | "secondary" | "accent" | "success" | "danger" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  secondary: "bg-secondary/15 text-secondary border-secondary/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  success: "bg-success/15 text-success border-success/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  neutral: "bg-white/5 text-muted border-white/10",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
