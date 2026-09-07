"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Save,
  X,
  Archive,
  RotateCcw,
  Star,
  TrendingUp,
  GripVertical,
  Layers,
} from "lucide-react";
import { adminCatalogApi, type CatalogGameDTO, type CatalogCategoryDTO } from "@/lib/api/catalog";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

type Draft = Partial<CatalogGameDTO> & { id?: string };

/**
 * Admin catalog management. Every field the public catalog renders is
 * editable here — title, slug, category, copy, art URLs, featured and
 * trending flags, display order, status. Nothing is hardcoded in the UI.
 */
export default function AdminGamesPage() {
  const { toast } = useToast();
  const [games, setGames] = useState<CatalogGameDTO[]>([]);
  const [categories, setCategories] = useState<CatalogCategoryDTO[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [g, c] = await Promise.all([
        adminCatalogApi.listGames({ search: search || undefined, includeArchived: showArchived }),
        adminCatalogApi.listCategories(true),
      ]);
      setGames(g.data.data.games);
      setCategories(c.data.data.categories);
    } catch {
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, showArchived]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!editing || !editing.title?.trim() || !editing.slug?.trim()) {
      toast({ variant: "error", title: "Title and slug are required" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        slug: editing.slug.trim(),
        title: editing.title.trim(),
        description: editing.description ?? "",
        longDescription: editing.longDescription ?? null,
        categoryId: editing.categoryId ?? null,
        coverImageUrl: editing.coverImageUrl ?? null,
        logoUrl: editing.logoUrl ?? null,
        bannerUrl: editing.bannerUrl ?? null,
        displayOrder: Number(editing.displayOrder ?? 0),
        isFeatured: Boolean(editing.isFeatured),
        isTrending: Boolean(editing.isTrending),
        status: editing.status ?? "PUBLISHED",
      };
      if (editing.id) await adminCatalogApi.updateGame(editing.id, payload);
      else await adminCatalogApi.createGame(payload);
      setEditing(null);
      await load();
      toast({ variant: "success", title: editing.id ? "Game updated" : "Game created" });
    } catch (err) {
      toast({ variant: "error", title: "Save failed", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(id: string) {
    try {
      await adminCatalogApi.archiveGame(id);
      await load();
      toast({ variant: "success", title: "Game archived" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleRestore(id: string) {
    try {
      await adminCatalogApi.restoreGame(id);
      await load();
      toast({ variant: "success", title: "Game restored" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function quickToggle(game: CatalogGameDTO, field: "isFeatured" | "isTrending") {
    try {
      await adminCatalogApi.updateGame(game.id, { [field]: !game[field] });
      setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, [field]: !g[field] } : g)));
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Game Catalog</h1>
          <p className="text-sm text-muted">{games.length} games — everything here drives the public site.</p>
        </div>
        <button
          onClick={() =>
            setEditing({ title: "", slug: "", description: "", displayOrder: games.length + 1, status: "PUBLISHED" })
          }
          className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Game
        </button>
      </div>

      {/* Search + archived toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Show archived
        </label>
      </div>

      {/* Editor */}
      {editing && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-surface/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">
              {editing.id ? `Edit — ${editing.title}` : "New Game"}
            </h2>
            <button onClick={() => setEditing(null)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("Title", editing.title ?? "", (v) => setEditing((s) => ({ ...s!, title: v })), "Cash Frenzy")}
            {field("Slug (URL)", editing.slug ?? "", (v) => setEditing((s) => ({ ...s!, slug: v })), "cash-frenzy")}

            <div>
              <label className="mb-1 block text-xs text-muted">Category</label>
              <select
                value={editing.categoryId ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, categoryId: e.target.value || null }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="" className="bg-surface">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Status</label>
              <select
                value={editing.status ?? "PUBLISHED"}
                onChange={(e) => setEditing((s) => ({ ...s!, status: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none"
              >
                {["PUBLISHED", "DRAFT", "ARCHIVED"].map((st) => (
                  <option key={st} value={st} className="bg-surface">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">Short description</label>
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">Long description</label>
              <textarea
                value={editing.longDescription ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, longDescription: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </div>

            {field("Cover image URL", editing.coverImageUrl ?? "", (v) => setEditing((s) => ({ ...s!, coverImageUrl: v })), "/games/teen-patti.jpg")}
            {field("Logo URL", editing.logoUrl ?? "", (v) => setEditing((s) => ({ ...s!, logoUrl: v })))}
            {field("Banner URL", editing.bannerUrl ?? "", (v) => setEditing((s) => ({ ...s!, bannerUrl: v })))}
            {field("Display order", String(editing.displayOrder ?? 0), (v) => setEditing((s) => ({ ...s!, displayOrder: Number(v) || 0 })))}

            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isFeatured)}
                  onChange={(e) => setEditing((s) => ({ ...s!, isFeatured: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isTrending)}
                  onChange={(e) => setEditing((s) => ({ ...s!, isTrending: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                Trending
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {isSaving ? "Saving…" : "Save Game"}
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {games.map((g) => (
            <div
              key={g.id}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-surface/40 p-3"
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted/40" />

              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                {g.coverImageUrl && (
                  <Image src={g.coverImageUrl} alt={`${g.title} artwork`} fill sizes="64px" className="object-cover" />
                )}
              </div>

              <button onClick={() => setEditing(g)} className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-white">{g.title}</p>
                <p className="truncate text-xs text-muted">
                  /{g.slug} · {g.category?.name ?? "Uncategorised"} · #{g.displayOrder}
                </p>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => quickToggle(g, "isFeatured")}
                  className={cn("rounded-lg p-2 transition-colors", g.isFeatured ? "text-accent" : "text-muted/40 hover:text-muted")}
                  aria-label="Toggle featured"
                  title="Featured"
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  onClick={() => quickToggle(g, "isTrending")}
                  className={cn("rounded-lg p-2 transition-colors", g.isTrending ? "text-secondary" : "text-muted/40 hover:text-muted")}
                  aria-label="Toggle trending"
                  title="Trending"
                >
                  <TrendingUp className="h-4 w-4" />
                </button>
                {g.status === "ARCHIVED" ? (
                  <button onClick={() => handleRestore(g.id)} className="rounded-lg p-2 text-muted hover:text-success" aria-label="Restore" title="Restore">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={() => handleArchive(g.id)} className="rounded-lg p-2 text-muted hover:text-danger" aria-label="Archive" title="Archive">
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories quick manager */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Layers className="h-4 w-4 text-primary" /> Categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                c.isActive ? "border-white/10 text-white" : "border-white/5 text-muted/50 line-through"
              )}
            >
              {c.name}
              <span className="ml-1.5 text-xs text-muted">{c._count?.games ?? 0}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Assign a game to a category by editing the game above.
        </p>
      </div>
    </div>
  );
}
