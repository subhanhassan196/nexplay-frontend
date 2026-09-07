"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Users, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { formatCompactNumber } from "@/lib/utils";
import { type CatalogGameDTO } from "@/lib/api/catalog";
import { getGames } from "@/lib/catalogCache";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Editor's-pick row. Which games appear here is controlled entirely by
 * the "Featured" toggle in the admin panel — no code change needed to
 * promote or demote a title.
 */
export function FeaturedGames() {
  const [games, setGames] = useState<CatalogGameDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getGames()
      .then((all) => {
        if (cancelled) return;
        setGames(all.filter((g) => g.isFeatured).slice(0, 3));
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && games.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-nexplay flex flex-col gap-10">
        <SectionHeading
          eyebrow="Editor's Pick"
          title="Featured"
          highlight="Titles"
          description="Hand-selected experiences that showcase what NexPlay is capable of."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />
              ))
            : games.map((game, i) => (
                <Reveal key={game.id} index={i}>
                <Link href={`/games/${game.slug}`} className="group">
                  <GlassPanel className="h-full overflow-hidden transition-colors hover:border-primary/40">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={game.coverImageUrl || "/games/placeholder.jpg"}
                        alt={`${game.title} artwork`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      {game.category && (
                        <div className="absolute left-3 top-3">
                          <Badge variant="primary">{game.category.name}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-semibold text-white">{game.title}</h3>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary" />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{game.description}</p>

                      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                        {Number(game.averageRating) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-accent" />
                            {Number(game.averageRating).toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {formatCompactNumber(game.activePlayers)} players
                        </span>
                      </div>
                    </div>
                  </GlassPanel>
                </Link>
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
