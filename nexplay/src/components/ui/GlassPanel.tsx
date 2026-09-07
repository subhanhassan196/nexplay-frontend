import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Base glassmorphism surface used by cards, nav bar, modals, and panels
 * across the entire platform. Keeping this as a single primitive means
 * a single visual-language change updates every surface at once.
 */
export function GlassPanel({
  className,
  hoverGlow = false,
  as: Tag = "div",
  ...props
}: GlassPanelProps) {
  const Component = Tag as React.ElementType;
  return (
    <Component
      className={cn(
        "glass-panel relative overflow-hidden",
        hoverGlow &&
          "transition-shadow duration-300 hover:shadow-glow-primary hover:border-primary/30",
        className
      )}
      {...props}
    />
  );
}
