"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal snap-scroll carousel used for Featured Streamers,
 * Trending Games (mobile), and Community trending posts.
 */
export function Carousel({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2",
          className
        )}
      >
        {children}
      </div>
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="glass absolute left-0 top-1/2 hidden h-10 w-10 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity hover:bg-primary/20 md:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="glass absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full text-white transition-opacity hover:bg-primary/20 md:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CarouselItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("shrink-0 snap-start", className)}>{children}</div>;
}
