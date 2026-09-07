import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

interface AvatarProps {
  name: string;
  size?: keyof typeof sizeMap;
  online?: boolean;
  className?: string;
}

/**
 * Gradient-initial avatar (no external image dependency for Phase 2).
 * Swap the inner span for a real <Image> once player avatar uploads exist.
 */
export function Avatar({ name, size = "md", online, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-nexplay-gradient font-display font-semibold text-white",
          sizeMap[size]
        )}
      >
        {initials}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
            online ? "bg-success" : "bg-muted-foreground"
          )}
        />
      )}
    </span>
  );
}
