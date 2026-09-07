import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * Standard heading block used at the top of every home-page section
 * (Trending Games, Categories, Tournaments preview, etc.) to keep
 * typographic rhythm consistent site-wide.
 */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold text-white sm:text-4xl md:text-5xl">
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </h2>
      {description && (
        <p className={cn("max-w-2xl text-muted", align === "center" && "mx-auto")}>
          {description}
        </p>
      )}
    </div>
  );
}
