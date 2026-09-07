"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Users, MessageCircle, Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TiltCard } from "@/components/motion/TiltCard";
import { formatCompactNumber, cn } from "@/lib/utils";
import type { Game } from "@/types";

interface GameCardProps {
  game: Game;
  /** Set on the first few cards above the fold so they load eagerly. */
  priority?: boolean;
  className?: string;
}

/**
 * Primary game card, used on the homepage rows, the games listing and
 * category pages.
 *
 * Hover is layered rather than a single effect: the card lifts, the art
 * scales gently, a sheen sweeps across, and the support affordance fades
 * in. Each piece is small on its own — together they make the card feel
 * responsive to the cursor without being loud.
 *
 * Images run through Next's optimizer (previously they were marked
 * `unoptimized`, which shipped the full-size source to every card).
 */
export function GameCard({ game, priority = false, className }: GameCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <TiltCard maxTilt={reduceMotion ? 0 : 6} className={cn("group relative", className)}>
      <motion.div
        whileHover={reduceMotion ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <Link
          href={`/games/${game.slug}`}
          className="glass-panel block overflow-hidden transition-[border-color,box-shadow] duration-300 group-hover:border-primary/40 group-hover:shadow-[0_12px_40px_-16px_rgba(124,58,237,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
            {/* Initials placeholder — holds the frame until the art decodes,
                so the grid never reflows as images arrive. */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 via-surface to-secondary/20 transition-opacity duration-500",
                loaded && "opacity-0"
              )}
            >
              <span className="font-display text-2xl font-bold text-white/20">
                {game.title.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <Image
              src={game.coverImage}
              alt={`${game.title} cover art`}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={() => setLoaded(true)}
              className={cn(
                "object-cover transition-[transform,opacity] duration-500 ease-out group-hover:scale-[1.06]",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Sheen sweep on hover — pure transform, no repaint cost. */}
            {!reduceMotion && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-90" />

            <div className="absolute left-3 top-3 flex gap-2">
              {game.isTrending && <Badge variant="accent">Trending</Badge>}
              {game.isFeatured && !game.isTrending && <Badge variant="secondary">Featured</Badge>}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                setWishlisted((w) => !w);
              }}
              aria-label={wishlisted ? `Remove ${game.title} from wishlist` : `Add ${game.title} to wishlist`}
              aria-pressed={wishlisted}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/60"
            >
              <Heart className={cn("h-4 w-4 transition-colors", wishlisted ? "fill-danger text-danger" : "text-white")} />
            </button>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform duration-300 group-hover:scale-100">
                <MessageCircle className="h-5 w-5 text-white" />
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-display text-base font-semibold text-white transition-colors group-hover:text-primary">
                {game.title}
              </h3>
              {game.rating > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
                  <Star className="h-3.5 w-3.5 fill-accent" />
                  {game.rating.toFixed(1)}
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted">{game.description}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Users className="h-3.5 w-3.5" />
              {formatCompactNumber(game.players)} players
            </div>
          </div>
        </Link>
      </motion.div>
    </TiltCard>
  );
}
