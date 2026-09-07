"use client";

import { useCallback, useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Users, Headset, ArrowLeft, Gamepad2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { catalogApi, type CatalogGameDTO } from "@/lib/api/catalog";
import { useMessenger } from "@/context/MessengerContext";
import { formatCompactNumber } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Game detail page. Every field — title, art, category, copy, flags —
 * is loaded from the database, so the catalog is fully admin-managed
 * with no game-specific code anywhere in the frontend.
 */
export default function GameDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { openWithGame } = useMessenger();

  const [game, setGame] = useState<CatalogGameDTO | null>(null);
  const [related, setRelated] = useState<CatalogGameDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await catalogApi.getGame(slug);
      const loaded = data.data.game;
      setGame(loaded);

      // Related = same category, excluding this game.
      if (loaded.category?.slug) {
        const { data: rel } = await catalogApi.listGames({ category: loaded.category.slug, limit: 5 });
        setRelated(rel.data.filter((g) => g.slug !== loaded.slug).slice(0, 4));
      }
    } catch {
      setNotFoundFlag(true);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFoundFlag) notFound();

  if (isLoading || !game) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
        <div className="mt-6 h-8 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  const heroImage = game.bannerUrl || game.coverImageUrl || "/games/placeholder.jpg";
  const rating = Number(game.averageRating) || 0;

  function handleSupport() {
    if (!game) return;
    openWithGame({
      slug: game.slug,
      title: game.title,
      logoUrl: game.logoUrl || game.coverImageUrl,
    });
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="relative h-[280px] w-full overflow-hidden sm:h-[380px]">
        <Image
          src={heroImage}
          alt={`${game.title} artwork`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 pb-8">
            <Link
              href="/games"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> All games
            </Link>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end gap-6">
              {/* Logo tile */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:h-28 sm:w-28">
                <Image
                  src={game.logoUrl || heroImage}
                  alt={`${game.title} logo`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {game.category && <Badge variant="primary">{game.category.name}</Badge>}
                  {game.isTrending && <Badge variant="accent">Trending</Badge>}
                  {game.isFeatured && <Badge variant="secondary">Featured</Badge>}
                </div>
                <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{game.title}</h1>
                <p className="mt-1 max-w-xl text-sm text-muted">{game.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                  {rating > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-accent" />
                      {rating.toFixed(1)} rating
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {formatCompactNumber(game.activePlayers)} players
                  </span>
                </div>
              </div>

              {/* Access & Support → opens the ONE global messenger, tagged with this game */}
              <button
                onClick={handleSupport}
                className="flex items-center gap-2 rounded-xl bg-nexplay-gradient px-6 py-3 font-medium text-white shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <Headset className="h-5 w-5" />
                Get Access &amp; Support
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto mt-8 grid max-w-6xl gap-6 px-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GlassPanel className="p-6">
            <h2 className="mb-3 font-display text-lg font-semibold text-white">About {game.title}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {game.longDescription || game.description}
            </p>
          </GlassPanel>

          {related.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-white">
                More in {game.category?.name ?? "this category"}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {related.map((g) => (
                  <Link
                    key={g.id}
                    href={`/games/${g.slug}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/40 transition-colors hover:border-primary/40"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={g.coverImageUrl || "/games/placeholder.jpg"}
                        alt={`${g.title} artwork`}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <p className="truncate px-3 py-2 text-sm font-medium text-white">{g.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <GlassPanel className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-white">Game Information</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Category</dt>
                <dd className="flex items-center gap-1.5 text-white">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  {game.category?.name ?? "Uncategorised"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Status</dt>
                <dd className="capitalize text-white">{game.status.toLowerCase()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Players</dt>
                <dd className="text-white">{formatCompactNumber(game.activePlayers)}</dd>
              </div>
              {rating > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Rating</dt>
                  <dd className="text-white">
                    {rating.toFixed(1)} / 5.0 ({game.ratingsCount})
                  </dd>
                </div>
              )}
            </dl>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-white">Need help?</h3>
            </div>
            <p className="mb-3 text-sm text-muted">
              Our support team can help you with access, account questions, or anything about {game.title}.
            </p>
            <button
              onClick={handleSupport}
              className="w-full rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/20"
            >
              Open Support Chat
            </button>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
