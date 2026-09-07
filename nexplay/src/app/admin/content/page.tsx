"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, FileText, HelpCircle, Edit3, X } from "lucide-react";
import { cmsApi, type FaqDTO, type LegalPageDTO } from "@/lib/api/cms";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

type Tab = "faq" | "legal";

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("faq");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Content Management</h1>
        <p className="text-sm text-muted">Edit FAQs and legal pages — no code changes needed.</p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("faq")}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
            tab === "faq" ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
          )}
        >
          <HelpCircle className="h-4 w-4" /> FAQ
        </button>
        <button
          onClick={() => setTab("legal")}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
            tab === "legal" ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
          )}
        >
          <FileText className="h-4 w-4" /> Legal Pages
        </button>
      </div>

      {tab === "faq" ? <FaqManager /> : <LegalManager />}
    </div>
  );
}

function FaqManager() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FaqDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState({ question: "", answer: "", category: "general" });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await cmsApi.listFaq();
      setFaqs(data.data.faqs);
    } catch {
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!draft.question.trim() || !draft.answer.trim()) return;
    try {
      await cmsApi.createFaq(draft);
      setDraft({ question: "", answer: "", category: "general" });
      await load();
      toast({ variant: "success", title: "FAQ added" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleDelete(id: string) {
    try {
      await cmsApi.deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      toast({ variant: "success", title: "Deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="rounded-2xl border border-white/10 bg-surface/40 p-5">
        <h2 className="mb-3 font-display text-sm font-semibold text-white">Add FAQ</h2>
        <div className="space-y-3">
          <input
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
            placeholder="Question"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={draft.answer}
            onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
            placeholder="Answer"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="Category"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No FAQs yet.</p>
      ) : (
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="group flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-surface/40 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{f.question}</p>
                <p className="mt-1 text-sm text-muted">{f.answer}</p>
                <span className="mt-2 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">{f.category}</span>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4 text-muted hover:text-danger" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LegalManager() {
  const { toast } = useToast();
  const [pages, setPages] = useState<LegalPageDTO[]>([]);
  const [editing, setEditing] = useState<{ slug: string; title: string; body: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await cmsApi.listLegal();
      setPages(data.data.pages);
    } catch {
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!editing || !editing.slug.trim() || !editing.title.trim()) return;
    try {
      await cmsApi.upsertLegal(editing.slug, { title: editing.title, body: editing.body });
      setEditing(null);
      await load();
      toast({ variant: "success", title: "Page saved" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleDelete(slug: string) {
    try {
      await cmsApi.deleteLegal(slug);
      setPages((prev) => prev.filter((p) => p.slug !== slug));
      toast({ variant: "success", title: "Deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setEditing({ slug: "", title: "", body: "" })}
        className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> New Page
      </button>

      {editing && (
        <div className="rounded-2xl border border-primary/30 bg-surface/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">
              {pages.some((p) => p.slug === editing.slug) ? "Edit" : "New"} Page
            </h2>
            <button onClick={() => setEditing(null)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              value={editing.slug}
              onChange={(e) => setEditing((s) => (s ? { ...s, slug: e.target.value } : s))}
              placeholder="slug (e.g. terms, privacy, about)"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <input
              value={editing.title}
              onChange={(e) => setEditing((s) => (s ? { ...s, title: e.target.value } : s))}
              placeholder="Page title"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <textarea
              value={editing.body}
              onChange={(e) => setEditing((s) => (s ? { ...s, body: e.target.value } : s))}
              placeholder="Page content (markdown supported)"
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((p) => (
            <div key={p.id} className="group flex items-center justify-between rounded-xl border border-white/10 bg-surface/40 p-4">
              <div>
                <p className="font-medium text-white">{p.title}</p>
                <p className="text-xs text-muted">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditing({ slug: p.slug, title: p.title, body: p.body })}
                  aria-label="Edit"
                >
                  <Edit3 className="h-4 w-4 text-muted hover:text-white" />
                </button>
                <button onClick={() => handleDelete(p.slug)} aria-label="Delete">
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
