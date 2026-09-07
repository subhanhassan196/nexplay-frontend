"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Users, Clock, Calendar } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/StateScreens";
import { tournamentApi, type TournamentDTO } from "@/lib/api/platform";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; variant: "primary" | "secondary" | "accent" }> = {
  REGISTRATION_OPEN: { label: "Registration Open", variant: "secondary" },
  LIVE: { label: "Live Now", variant: "accent" },
  UPCOMING: { label: "Upcoming", variant: "primary" },
  COMPLETED: { label: "Completed", variant: "primary" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Tournament listing. Every card links to a real slug that resolves on
 * the detail route — this is what removed the previous dead links.
 */
export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await tournamentApi.list();
      setTournaments(data.data.tournaments);
    } catch {
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-nexplay section-padding pt-28 sm:pt-32">
      <SectionHeading
        eyebrow="Compete"
        title="Tour"
        highlight="naments"
        description="Live and upcoming competitive events across every NexPlay title."
        className="mb-10"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments scheduled"
          description="New competitive events are announced regularly — check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {tournaments.map((t) => {
            const status = STATUS_LABEL[t.status] ?? { label: t.status, variant: "primary" as const };
            const filled = t._count?.participants ?? 0;
            const pct = Math.min(100, Math.round((filled / t.maxParticipants) * 100));

            return (
              <Link key={t.id} href={`/tournaments/${t.slug}`} className="group">
                <GlassPanel className="flex h-full flex-col overflow-hidden transition-colors hover:border-primary/40">
                  {(t.bannerUrl || t.game?.coverImageUrl) && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={t.bannerUrl || t.game?.coverImageUrl || "/games/placeholder.jpg"}
                        alt={`${t.title} banner`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(t.startsAt)}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-white">{t.title}</h3>
                    {t.game && <p className="text-sm text-muted">{t.game.title}</p>}
                    {t.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{t.description}</p>
                    )}

                    <div className="mt-auto pt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {filled} / {t.maxParticipants}
                        </span>
                        <span>{pct}% full</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-nexplay-gradient transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
