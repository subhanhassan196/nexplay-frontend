"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, LayoutGrid, List, Star, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Select } from "@/components/ui/Select";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/StateScreens";
import { type CatalogGameDTO, type CatalogCategoryDTO } from "@/lib/api/catalog";
import { getGames, getCategories } from "@/lib/catalogCache";
import { formatCompactNumber, cn } from "@/lib/utils";

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "name", label: "A – Z" },
];

/**
 * Full catalog. Games and categories are loaded from the database —
 * adding, renaming or recategorising a game in the admin panel is
 * reflected here with no code change.
 */
export default function GamesPage() {
  const [games, setGames] = useState<CatalogGameDTO[]>([]);
  const [categories, setCategories] = useState<CatalogCategoryDTO[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allGames, allCategories] = await Promise.all([getGames(), getCategories()]);
      setGames(allGames);
      setCategories(allCategories);
    } catch {
      setGames([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = games.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()));
    if (category !== "all") list = list.filter((g) => g.category?.slug === category);

    if (sort === "rating") list = [...list].sort((a, b) => Number(b.averageRating) - Number(a.averageRating));
    else if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else list = [...list].sort((a, b) => a.displayOrder - b.displayOrder || b.activePlayers - a.activePlayers);

    return list;
  }, [games, query, category, sort]);

  return (
    <div className="container-nexplay section-padding pt-32">
      <SectionHeading
        eyebrow="Library"
        title="All"
        highlight="Games"
        description="Explore the full NexPlay catalog."
        className="mb-8"
      />

      {/* Search + sort + view */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search games…"
            aria-label="Search games"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
        <Select value={sort} onChange={setSort} options={sortOptions} />
        <div className="flex rounded-xl border border-white/10 p-1">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={cn("rounded-lg p-2 transition-colors", view === "grid" ? "bg-white/10 text-white" : "text-muted")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={cn("rounded-lg p-2 transition-colors", view === "list" ? "bg-white/10 text-white" : "text-muted")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category chips — sourced from the database */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition-colors",
            category === "all" ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
          )}
        >
          All Games
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              category === c.slug ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
            )}
          >
            {c.name}
            {c._count && <span className="ml-1.5 text-xs opacity-60">{c._count.games}</span>}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No games found" description="Try a different search or category." />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((g) => (
            <GameRow key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameTile({ game }: { game: CatalogGameDTO }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/40 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={game.coverImageUrl || "/games/placeholder.jpg"}
          alt={`${game.title} artwork`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {game.isTrending && (
          <span className="absolute left-2 top-2 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-semibold text-black">
            Trending
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-medium text-white">{game.title}</p>
        <p className="truncate text-xs text-muted">{game.category?.name ?? "Games"}</p>
      </div>
    </Link>
  );
}

function GameRow({ game }: { game: CatalogGameDTO }) {
  const rating = Number(game.averageRating) || 0;
  return (
    <Link href={`/games/${game.slug}`}>
      <GlassPanel className="flex items-center gap-4 p-3 transition-colors hover:border-primary/40">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={game.coverImageUrl || "/games/placeholder.jpg"}
            alt={`${game.title} artwork`}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{game.title}</p>
          <p className="truncate text-xs text-muted">{game.description}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-4 text-xs text-muted sm:flex">
          {rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-accent" />
              {rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatCompactNumber(game.activePlayers)}
          </span>
        </div>
      </GlassPanel>
    </Link>
  );
}
