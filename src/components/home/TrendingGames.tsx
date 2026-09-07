"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/shared/GameCard";
import { Reveal } from "@/components/motion/Reveal";
import { getGames } from "@/lib/catalogCache";
import { toGames } from "@/lib/adapters/game";
import type { Game } from "@/types";

/**
 * Trending row on the homepage. Reads the live catalog, so the titles
 * here are always the same ones the games page and admin panel show —
 * there is no separate hardcoded list to drift out of sync.
 */
export function TrendingGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getGames()
      .then((all) => {
        if (cancelled) return;
        setGames(toGames(all.filter((g) => g.isTrending).slice(0, 4)));
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing trending yet? Don't render an empty section on the homepage.
  if (!isLoading && games.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-nexplay flex flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Right Now"
            title="Trending"
            highlight="Games"
            description="The titles the NexPlay community can't stop playing this week."
          />
          <Button href="/games" variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
            View All Games
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5" />
              ))
            : games.map((game, i) => (
                <Reveal key={game.id} index={i}>
                  {/* First row loads eagerly — it's the first art a visitor sees. */}
                  <GameCard game={game} priority={i < 2} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}
