"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, Search as SearchIcon, X } from "lucide-react";
import { seoApi, type SeoMetaDTO } from "@/lib/api/cms";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";

const BLANK: SeoMetaDTO = {
  path: "",
  title: "",
  description: "",
  keywords: [],
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  twitterCard: "summary_large_image",
  canonicalUrl: null,
  robots: "index,follow",
  structuredData: null,
};

export default function AdminSeoPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<SeoMetaDTO[]>([]);
  const [editing, setEditing] = useState<SeoMetaDTO | null>(null);
  const [keywordsText, setKeywordsText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await seoApi.list();
      setEntries(data.data.items);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(entry: SeoMetaDTO) {
    setEditing(entry);
    setKeywordsText(entry.keywords.join(", "));
  }

  async function handleSave() {
    if (!editing || !editing.path.trim() || !editing.title.trim()) return;
    const payload: SeoMetaDTO = {
      ...editing,
      keywords: keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };
    try {
      await seoApi.upsert(payload);
      setEditing(null);
      await load();
      toast({ variant: "success", title: "SEO saved" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleDelete(path: string) {
    try {
      await seoApi.remove(path);
      setEntries((prev) => prev.filter((e) => e.path !== path));
      toast({ variant: "success", title: "Deleted" });
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">SEO Management</h1>
          <p className="text-sm text-muted">Per-page meta titles, descriptions, Open Graph & more.</p>
        </div>
        <button
          onClick={() => startEdit({ ...BLANK })}
          className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Entry
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-surface/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Edit SEO — {editing.path || "new"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("Path", editing.path, (v) => setEditing((s) => (s ? { ...s, path: v } : s)), "/games")}
            {field("Title", editing.title, (v) => setEditing((s) => (s ? { ...s, title: v } : s)), "Page title")}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">Description</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing((s) => (s ? { ...s, description: e.target.value } : s))}
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              {field("Keywords (comma-separated)", keywordsText, setKeywordsText, "gaming, esports, tournaments")}
            </div>
            {field("OG Image URL", editing.ogImageUrl ?? "", (v) => setEditing((s) => (s ? { ...s, ogImageUrl: v } : s)))}
            {field("Canonical URL", editing.canonicalUrl ?? "", (v) => setEditing((s) => (s ? { ...s, canonicalUrl: v } : s)))}
            {field("Robots", editing.robots ?? "", (v) => setEditing((s) => (s ? { ...s, robots: v } : s)), "index,follow")}
          </div>
          <button
            onClick={handleSave}
            className="mt-4 flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-surface/40 p-12 text-center">
          <SearchIcon className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No SEO entries. Pages use default meta until you add one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.path} className="group flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-surface/40 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-primary">{e.path}</p>
                <p className="mt-1 font-medium text-white">{e.title}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted">{e.description}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => startEdit(e)} aria-label="Edit" className="text-muted hover:text-white">
                  <Save className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(e.path)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-muted hover:text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
