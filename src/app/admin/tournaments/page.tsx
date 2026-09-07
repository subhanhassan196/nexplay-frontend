"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, X, Trophy, Calendar, Users } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { adminTournamentApi, type TournamentDTO } from "@/lib/api/platform";
import { adminCatalogApi, type CatalogGameDTO } from "@/lib/api/catalog";
import { getApiErrorMessage } from "@/lib/api/axios";

const STATUSES = ["DRAFT", "UPCOMING", "REGISTRATION_OPEN", "LIVE", "COMPLETED", "CANCELLED"];
const FORMATS = ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "SWISS"];

type Draft = Partial<TournamentDTO> & { gameId?: string; id?: string };

/** Converts an ISO string to the value a datetime-local input expects. */
function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function AdminTournamentsPage() {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<TournamentDTO[]>([]);
  const [games, setGames] = useState<CatalogGameDTO[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [t, g] = await Promise.all([adminTournamentApi.list(), adminCatalogApi.listGames()]);
      setTournaments(t.data.data.tournaments);
      setGames(g.data.data.games);
    } catch {
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!editing?.title?.trim() || !editing.slug?.trim() || !editing.gameId || !editing.startsAt) {
      toast({ variant: "error", title: "Title, slug, game and start date are required" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        slug: editing.slug.trim(),
        title: editing.title.trim(),
        description: editing.description ?? null,
        rules: editing.rules ?? null,
        bannerUrl: editing.bannerUrl ?? null,
        gameId: editing.gameId,
        status: editing.status ?? "DRAFT",
        format: editing.format ?? "SINGLE_ELIMINATION",
        maxParticipants: Number(editing.maxParticipants ?? 64),
        startsAt: new Date(editing.startsAt).toISOString(),
        endsAt: editing.endsAt ? new Date(editing.endsAt).toISOString() : null,
        registrationClosesAt: editing.registrationClosesAt ? new Date(editing.registrationClosesAt).toISOString() : null,
      };
      if (editing.id) await adminTournamentApi.update(editing.id, payload as never);
      else await adminTournamentApi.create(payload as never);
      setEditing(null);
      await load();
      toast({ variant: "success", title: editing.id ? "Tournament updated" : "Tournament created" });
    } catch (err) {
      toast({ variant: "error", title: "Save failed", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminTournamentApi.remove(id);
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      toast({ variant: "success", title: "Tournament deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Delete failed", description: getApiErrorMessage(err) });
    }
  }

  const field = (label: string, value: string, onChange: (v: string) => void, type = "text", placeholder?: string) => (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Tournaments</h1>
          <p className="text-sm text-muted">{tournaments.length} events — drafts stay hidden from the public site.</p>
        </div>
        <button
          onClick={() => setEditing({ title: "", slug: "", maxParticipants: 64, status: "DRAFT" })}
          className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Tournament
        </button>
      </div>

      {editing && (
        <GlassPanel className="mb-6 border-primary/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">
              {editing.id ? `Edit — ${editing.title}` : "New Tournament"}
            </h2>
            <button onClick={() => setEditing(null)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Title", editing.title ?? "", (v) => setEditing((s) => ({ ...s!, title: v })), "text", "Cash Frenzy Weekly Cup")}
            {field("Slug", editing.slug ?? "", (v) => setEditing((s) => ({ ...s!, slug: v })), "text", "cash-frenzy-weekly-cup")}

            <div>
              <label className="mb-1 block text-xs text-muted">Game</label>
              <select
                value={editing.gameId ?? editing.game?.id ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, gameId: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="" className="bg-surface">Select a game…</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface">
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Status</label>
              <select
                value={editing.status ?? "DRAFT"}
                onChange={(e) => setEditing((s) => ({ ...s!, status: e.target.value as TournamentDTO["status"] }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-surface">
                    {st.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Format</label>
              <select
                value={editing.format ?? "SINGLE_ELIMINATION"}
                onChange={(e) => setEditing((s) => ({ ...s!, format: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f} className="bg-surface">
                    {f.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {field("Max participants", String(editing.maxParticipants ?? 64), (v) =>
              setEditing((s) => ({ ...s!, maxParticipants: Number(v) || 0 })), "number")}
            {field("Starts at", toLocalInput(editing.startsAt), (v) => setEditing((s) => ({ ...s!, startsAt: v })), "datetime-local")}
            {field("Ends at", toLocalInput(editing.endsAt), (v) => setEditing((s) => ({ ...s!, endsAt: v })), "datetime-local")}
            {field("Registration closes", toLocalInput(editing.registrationClosesAt), (v) =>
              setEditing((s) => ({ ...s!, registrationClosesAt: v })), "datetime-local")}
            {field("Banner URL", editing.bannerUrl ?? "", (v) => setEditing((s) => ({ ...s!, bannerUrl: v })))}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">Description</label>
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">Rules</label>
              <textarea
                value={editing.rules ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, rules: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {isSaving ? "Saving…" : "Save Tournament"}
          </button>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No tournaments yet. Create your first event.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <GlassPanel key={t.id} className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <button onClick={() => setEditing({ ...t, gameId: t.game?.id })} className="min-w-0 flex-1 text-left">
                <p className="flex items-center gap-2 truncate font-medium text-white">
                  {t.title}
                  <Badge variant={t.status === "LIVE" ? "accent" : t.status === "DRAFT" ? "primary" : "secondary"}>
                    {t.status.replace(/_/g, " ")}
                  </Badge>
                </p>
                <p className="truncate text-xs text-muted">
                  /{t.slug} · {t.game?.title ?? "no game"}
                </p>
              </button>

              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(t.startsAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Users className="h-3.5 w-3.5" />
                {t._count?.participants ?? 0}/{t.maxParticipants}
              </span>

              <button onClick={() => handleDelete(t.id)} className="rounded-lg p-2 text-muted hover:text-danger" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
