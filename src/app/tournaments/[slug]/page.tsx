"use client";

import { useCallback, useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, Users, Calendar, ArrowLeft, Gamepad2, ScrollText, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { tournamentApi, type TournamentDTO } from "@/lib/api/platform";
import { getApiErrorMessage } from "@/lib/api/axios";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<string, { label: string; variant: "primary" | "secondary" | "accent" }> = {
  REGISTRATION_OPEN: { label: "Registration Open", variant: "secondary" },
  LIVE: { label: "Live Now", variant: "accent" },
  UPCOMING: { label: "Upcoming", variant: "primary" },
  COMPLETED: { label: "Completed", variant: "primary" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Tournament detail page. Loads a real record by slug — the route that
 * every tournament card links to, which is what resolved the earlier
 * 404s on the tournaments page.
 */
export default function TournamentDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<TournamentDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await tournamentApi.getBySlug(slug);
      setTournament(data.data.tournament);
    } catch {
      setMissing(true);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (missing) notFound();

  if (isLoading || !tournament) {
    return (
      <div className="container-nexplay section-padding pt-32">
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
        <div className="mt-6 h-8 w-64 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  const status = STATUS_LABEL[tournament.status] ?? { label: tournament.status, variant: "primary" as const };
  const filled = tournament._count?.participants ?? tournament.participants?.length ?? 0;
  const pct = Math.min(100, Math.round((filled / tournament.maxParticipants) * 100));
  const canRegister = tournament.status === "REGISTRATION_OPEN" && filled < tournament.maxParticipants;

  async function handleRegister() {
    if (!tournament) return;
    setIsJoining(true);
    try {
      await tournamentApi.register(tournament.slug);
      await load();
      toast({ variant: "success", title: "You're registered!", description: tournament.title });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't register", description: getApiErrorMessage(err) });
    } finally {
      setIsJoining(false);
    }
  }

  const heroImage = tournament.bannerUrl || tournament.game?.coverImageUrl || "/games/placeholder.jpg";

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="relative h-[240px] w-full overflow-hidden sm:h-[320px]">
        <Image src={heroImage} alt={`${tournament.title} banner`} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 pb-8">
            <Link
              href="/tournaments"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> All tournaments
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {tournament.game && (
                    <Link href={`/games/${tournament.game.slug}`}>
                      <Badge variant="primary">{tournament.game.title}</Badge>
                    </Link>
                  )}
                </div>
                <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{tournament.title}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(tournament.startsAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {filled} / {tournament.maxParticipants} players
                  </span>
                </p>
              </div>

              {canRegister &&
                (isAuthenticated ? (
                  <button
                    onClick={handleRegister}
                    disabled={isJoining}
                    className="flex items-center gap-2 rounded-xl bg-nexplay-gradient px-6 py-3 font-medium text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trophy className="h-5 w-5" />}
                    {isJoining ? "Registering…" : "Register"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 font-medium text-white transition-colors hover:bg-primary/20"
                  >
                    Log in to register
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto mt-8 grid max-w-6xl gap-6 px-4 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {tournament.description && (
            <GlassPanel className="p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-white">About this event</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{tournament.description}</p>
            </GlassPanel>
          )}

          {tournament.rules && (
            <GlassPanel className="p-6">
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-white">
                <ScrollText className="h-4 w-4 text-primary" /> Rules
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{tournament.rules}</p>
            </GlassPanel>
          )}

          {tournament.participants && tournament.participants.length > 0 && (
            <GlassPanel className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-white">
                Registered players ({tournament.participants.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {tournament.participants.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nexplay-gradient/30 text-[10px] font-semibold">
                      {p.user.username.slice(0, 2).toUpperCase()}
                    </span>
                    {p.user.username}
                  </span>
                ))}
              </div>
            </GlassPanel>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <GlassPanel className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-white">Event details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Format</dt>
                <dd className="text-white">{tournament.format.replace(/_/g, " ").toLowerCase()}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Starts</dt>
                <dd className="text-white">{formatDateTime(tournament.startsAt)}</dd>
              </div>
              {tournament.endsAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Ends</dt>
                  <dd className="text-white">{formatDateTime(tournament.endsAt)}</dd>
                </div>
              )}
              {tournament.registrationClosesAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Registration closes</dt>
                  <dd className="text-white">{formatDateTime(tournament.registrationClosesAt)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span>Capacity</span>
                <span>{pct}% full</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-nexplay-gradient" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </GlassPanel>

          {tournament.game && (
            <GlassPanel className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold text-white">Game</h3>
              </div>
              <Link
                href={`/games/${tournament.game.slug}`}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
              >
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={tournament.game.coverImageUrl || "/games/placeholder.jpg"}
                    alt={`${tournament.game.title} artwork`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </span>
                <span className="font-medium text-white">{tournament.game.title}</span>
              </Link>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
