"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Link2, Eye, EyeOff } from "lucide-react";
import { adminSupportApi } from "@/lib/api/adminSupport";
import { type QuickLinkDTO, type QuickLinkCategory } from "@/lib/api/messenger";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const CATEGORIES: QuickLinkCategory[] = [
  "FEATURED_GAME",
  "TRENDING_GAME",
  "REWARD",
  "TOURNAMENT",
  "CASINO",
  "POKER",
  "ROULETTE",
  "BLACKJACK",
  "SLOTS",
  "GENERAL",
];

function label(category: QuickLinkCategory) {
  return category
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminQuickLinksPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<QuickLinkDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "FEATURED_GAME" as QuickLinkCategory, label: "", url: "", iconName: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const { data } = await adminSupportApi.listQuickLinks();
      // Dedupe by id — guards against accidental duplicate rows from repeated seeds.
      const unique = Array.from(new Map(data.data.quickLinks.map((l) => [l.id, l])).values());
      setLinks(unique);
    } catch {
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!form.label.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      await adminSupportApi.createQuickLink({
        category: form.category,
        label: form.label.trim(),
        url: form.url.trim(),
        iconName: form.iconName.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setForm({ category: "FEATURED_GAME", label: "", url: "", iconName: "", description: "" });
      setShowForm(false);
      await load();
      toast({ variant: "success", title: "Quick link added" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link: QuickLinkDTO) {
    try {
      await adminSupportApi.updateQuickLink(link.id, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l)));
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function remove(id: string) {
    try {
      await adminSupportApi.deleteQuickLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast({ variant: "success", title: "Deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  // Group by category
  const grouped = links.reduce<Record<string, QuickLinkDTO[]>>((acc, l) => {
    (acc[l.category] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Quick Links</h1>
          <p className="text-sm text-muted">Shortcuts shown in the messenger&apos;s welcome screen.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-surface/40 p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as QuickLinkCategory })}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-surface">
                  {label(c)}
                </option>
              ))}
            </select>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Label (e.g. Daily Rewards)"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="URL (e.g. /rewards)"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <input
              value={form.iconName}
              onChange={(e) => setForm({ ...form, iconName: e.target.value })}
              placeholder="Icon name (lucide, e.g. Gift)"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm text-muted hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.label.trim() || !form.url.trim()}
              className="rounded-xl bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add Link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Icon names come from lucide-react (e.g. Gift, Trophy, Dices, Spade). Leave blank for a default.
          </p>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-surface/40 p-12 text-center">
          <Link2 className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No quick links yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([category, categoryLinks]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label(category as QuickLinkCategory)}</p>
              <div className="flex flex-col gap-2">
                {categoryLinks.map((link) => (
                  <div
                    key={link.id}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-xl border p-3",
                      link.isActive ? "border-white/10 bg-surface/40" : "border-white/5 bg-surface/20 opacity-60"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{link.label}</p>
                      <p className="truncate text-xs text-muted">{link.url}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => toggleActive(link)} className="admin-action-btn" aria-label="Toggle">
                        {link.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => remove(link.id)} className="admin-action-btn hover:text-danger" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
