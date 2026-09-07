"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, Plus, Send, Trash2, X, Users, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { workspaceApi, type BroadcastDTO, type CustomerTagDTO } from "@/lib/api/workspace";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "primary" | "secondary" | "accent"> = {
  DRAFT: "primary",
  SENDING: "accent",
  SENT: "secondary",
  FAILED: "accent",
};

/**
 * Broadcasts — one message delivered into many customer conversations,
 * targeted by tag.
 *
 * Sending is deliberately a two-step flow: you compose a draft, see how
 * many people it will reach, and only then send. A broadcast can't be
 * unsent, so the audience count before the button matters.
 */
export default function AdminBroadcastsPage() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastDTO[]>([]);
  const [tags, setTags] = useState<CustomerTagDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "", tagIds: [] as string[] });
  const [audience, setAudience] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<BroadcastDTO | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [b, t] = await Promise.all([workspaceApi.listBroadcasts(), workspaceApi.listTags()]);
      setBroadcasts(b.data.data.broadcasts);
      setTags(t.data.data.tags);
    } catch {
      setBroadcasts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Recalculate reach whenever the targeting changes.
  useEffect(() => {
    if (!composing) return;
    let cancelled = false;
    workspaceApi
      .previewAudience(draft.tagIds)
      .then(({ data }) => !cancelled && setAudience(data.data.count))
      .catch(() => !cancelled && setAudience(null));
    return () => {
      cancelled = true;
    };
  }, [composing, draft.tagIds]);

  function toggleTag(tagId: string) {
    setDraft((d) => ({
      ...d,
      tagIds: d.tagIds.includes(tagId) ? d.tagIds.filter((t) => t !== tagId) : [...d.tagIds, tagId],
    }));
  }

  async function saveDraft() {
    if (!draft.title.trim() || !draft.content.trim()) return;
    setIsSaving(true);
    try {
      await workspaceApi.createBroadcast(draft);
      setDraft({ title: "", content: "", tagIds: [] });
      setComposing(false);
      await load();
      toast({ variant: "success", title: "Draft saved" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't save", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function send(broadcast: BroadcastDTO) {
    setConfirmSend(null);
    setSendingId(broadcast.id);
    try {
      await workspaceApi.sendBroadcast(broadcast.id);
      await load();
      toast({ variant: "success", title: "Broadcast sent" });
    } catch (err) {
      toast({ variant: "error", title: "Send failed", description: getApiErrorMessage(err) });
      await load();
    } finally {
      setSendingId(null);
    }
  }

  async function remove(id: string) {
    try {
      await workspaceApi.deleteBroadcast(id);
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      toast({ variant: "error", title: "Couldn't delete", description: getApiErrorMessage(err) });
    }
  }

  const tagLabel = (id: string) => tags.find((t) => t.id === id)?.label ?? "tag";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Broadcasts</h1>
          <p className="text-sm text-muted">Send a support message to a group of customers.</p>
        </div>
        <button
          onClick={() => setComposing((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Broadcast
        </button>
      </div>

      {composing && (
        <GlassPanel className="mb-6 border-primary/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Compose</h2>
            <button onClick={() => setComposing(false)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>

          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Internal title (customers won't see this)"
            className="mb-3 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            placeholder="Message customers will receive…"
            rows={4}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />

          <p className="mb-2 text-xs text-muted">
            Target by tag — leave all unselected to reach every customer.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = draft.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-all",
                    on ? "text-white" : "border-white/10 text-muted hover:text-white"
                  )}
                  style={on ? { borderColor: tag.color, background: `${tag.color}22` } : undefined}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <Users className="h-4 w-4 text-primary" />
              {audience === null ? "Calculating…" : `Reaches ${audience} customer${audience === 1 ? "" : "s"}`}
            </span>
            <button
              onClick={saveDraft}
              disabled={!draft.title.trim() || !draft.content.trim() || isSaving}
              className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save draft
            </button>
          </div>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No broadcasts yet.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <GlassPanel key={b.id} className="p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-white">{b.title}</h3>
                  <Badge variant={STATUS_VARIANT[b.status] ?? "primary"}>{b.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {b.status === "DRAFT" && (
                    <button
                      onClick={() => setConfirmSend(b)}
                      disabled={sendingId === b.id}
                      className="flex items-center gap-1.5 rounded-lg bg-nexplay-gradient px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {sendingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Send
                    </button>
                  )}
                  {b.status !== "SENT" && (
                    <button onClick={() => remove(b.id)} className="rounded-lg p-1.5 text-muted hover:text-danger" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="mb-3 whitespace-pre-line text-sm text-muted">{b.content}</p>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 text-xs text-muted">
                {b.tagIds.length === 0 ? (
                  <span>All customers</span>
                ) : (
                  <span className="flex flex-wrap gap-1.5">
                    {b.tagIds.map((id) => (
                      <span key={id} className="rounded-full bg-white/5 px-2 py-0.5">
                        {tagLabel(id)}
                      </span>
                    ))}
                  </span>
                )}
                {b.status === "SENT" && (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    Delivered to {b.recipientCount}
                  </span>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Send confirmation — a broadcast can't be recalled. */}
      {confirmSend && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmSend(null)}
          role="dialog"
          aria-modal="true"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6">
            <div className="mb-3 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-accent" />
              <h2 className="font-display text-lg font-semibold text-white">Send this broadcast?</h2>
            </div>
            <p className="mb-5 text-sm text-muted">
              This message will be delivered into every targeted customer&apos;s support conversation. It can&apos;t be
              recalled once sent.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmSend(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => send(confirmSend)}
                className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Send className="h-4 w-4" /> Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
