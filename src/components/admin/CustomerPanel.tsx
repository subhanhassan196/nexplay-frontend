"use client";

import { useCallback, useEffect, useState } from "react";
import {
  StickyNote,
  Tags,
  Wallet,
  ShieldAlert,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Lock,
  UserSearch,
  Monitor,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import {
  workspaceApi,
  formatMinor,
  type InternalNoteDTO,
  type CustomerTagDTO,
  type TagAssignmentDTO,
  type FinancialRecordDTO,
  type FinancialSummaryDTO,
  type FinancialType,
  type MessageAuditDTO,
  type LoginRecordDTO,
  type RelatedAccountDTO,
} from "@/lib/api/workspace";
import { cn } from "@/lib/utils";

type Tab = "notes" | "tags" | "financials" | "security" | "audit";

interface CustomerPanelProps {
  conversationId: string;
  userId: string;
  username: string;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Right-hand context rail in the support inbox — everything an agent
 * needs about the customer without leaving the conversation.
 *
 * All four tabs are staff-only. Internal notes in particular are never
 * returned by any customer-facing endpoint, so there's no route by which
 * they reach the person being discussed.
 */
export function CustomerPanel({ conversationId, userId, username }: CustomerPanelProps) {
  const [tab, setTab] = useState<Tab>("notes");

  const tabs = [
    { id: "notes" as const, label: "Notes", icon: StickyNote },
    { id: "tags" as const, label: "Tags", icon: Tags },
    { id: "financials" as const, label: "Money", icon: Wallet },
    { id: "security" as const, label: "Accounts", icon: UserSearch },
    { id: "audit" as const, label: "Audit", icon: ShieldAlert },
  ];

  return (
    // Fills the slide-over on phones, fixed rail on desktop. A hard 320px
    // overflowed on narrow devices, which pushed the tabs off-screen.
    <div className="flex h-full w-[86vw] max-w-80 shrink-0 flex-col border-l border-white/10 sm:w-80">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="truncate font-display text-sm font-semibold text-white">{username}</p>
        <p className="text-xs text-muted">Customer context</p>
      </div>

      <div className="flex border-b border-white/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
              tab === t.id ? "border-b-2 border-primary text-white" : "text-muted hover:text-white"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "notes" && <NotesTab conversationId={conversationId} />}
        {tab === "tags" && <TagsTab userId={userId} />}
        {tab === "financials" && <FinancialsTab userId={userId} />}
        {tab === "security" && <SecurityTab userId={userId} />}
        {tab === "audit" && <AuditTab conversationId={conversationId} />}
      </div>
    </div>
  );
}

function NotesTab({ conversationId }: { conversationId: string }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<InternalNoteDTO[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await workspaceApi.listNotes(conversationId);
      setNotes(data.data.notes);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!draft.trim()) return;
    setIsSaving(true);
    try {
      const { data } = await workspaceApi.addNote(conversationId, draft.trim());
      setNotes((prev) => [data.data.note, ...prev]);
      setDraft("");
    } catch (err) {
      toast({ variant: "error", title: "Couldn't save note", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await workspaceApi.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast({ variant: "error", title: "Couldn't delete", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-2 text-[11px] text-accent">
        <Lock className="h-3 w-3 shrink-0" />
        Only staff can see these notes.
      </p>

      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this customer…"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
        <button
          onClick={add}
          disabled={!draft.trim() || isSaving}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-nexplay-gradient py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add note
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-lg border border-white/10 bg-surface/40 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-primary">{note.author.username}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted">{timeAgo(note.createdAt)}</span>
                  <button
                    onClick={() => remove(note.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3 w-3 text-muted hover:text-danger" />
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-line break-words text-xs text-white/90">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TagsTab({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [allTags, setAllTags] = useState<CustomerTagDTO[]>([]);
  const [assigned, setAssigned] = useState<TagAssignmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tagsRes, assignedRes] = await Promise.all([workspaceApi.listTags(), workspaceApi.getUserTags(userId)]);
      setAllTags(tagsRes.data.data.tags);
      setAssigned(assignedRes.data.data.tags);
    } catch {
      setAllTags([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const assignedIds = new Set(assigned.map((a) => a.tagId));

  async function toggle(tag: CustomerTagDTO) {
    try {
      const { data } = await workspaceApi.toggleUserTag(userId, tag.id);
      if (data.data.assigned) {
        setAssigned((prev) => [...prev, { id: tag.id, tagId: tag.id, createdAt: new Date().toISOString(), tag }]);
      } else {
        setAssigned((prev) => prev.filter((a) => a.tagId !== tag.id));
      }
    } catch (err) {
      toast({ variant: "error", title: "Couldn't update tag", description: getApiErrorMessage(err) });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-white/5" />
        ))}
      </div>
    );
  }

  if (allTags.length === 0) {
    return <p className="py-4 text-center text-xs text-muted">No tags configured yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">Tap a tag to apply or remove it.</p>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const on = assignedIds.has(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggle(tag)}
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
    </div>
  );
}

function FinancialsTab({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [records, setRecords] = useState<FinancialRecordDTO[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<{ type: FinancialType; amount: string; note: string }>({
    type: "DEPOSIT",
    amount: "",
    note: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await workspaceApi.getFinancials(userId);
      setRecords(data.data.records);
      setSummary(data.data.summary);
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const amount = parseFloat(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setIsSaving(true);
    try {
      // Stored in minor units so the ledger never accumulates float drift.
      await workspaceApi.addFinancial(userId, {
        type: draft.type,
        amountMinor: Math.round(amount * 100),
        note: draft.note || undefined,
      });
      setDraft({ type: "DEPOSIT", amount: "", note: "" });
      await load();
      toast({ variant: "success", title: "Record added" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't add record", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await workspaceApi.deleteFinancial(id);
      await load();
    } catch (err) {
      toast({ variant: "error", title: "Couldn't delete", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-success/20 bg-success/5 p-2.5">
              <p className="flex items-center gap-1 text-[10px] text-muted">
                <TrendingUp className="h-3 w-3 text-success" /> Deposit
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {formatMinor(summary.depositMinor, summary.currency)}
              </p>
            </div>
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-2.5">
              <p className="flex items-center gap-1 text-[10px] text-muted">
                <TrendingDown className="h-3 w-3 text-danger" /> Cashout
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {formatMinor(summary.cashoutMinor, summary.currency)}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5">
            <p className="text-[10px] text-muted">Net total</p>
            <p
              className={cn(
                "mt-0.5 font-display text-lg font-bold",
                summary.netMinor >= 0 ? "text-success" : "text-danger"
              )}
            >
              {formatMinor(summary.netMinor, summary.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Add */}
      <div className="space-y-2 rounded-lg border border-white/10 p-3">
        <select
          value={draft.type}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as FinancialType }))}
          className="w-full rounded-lg border border-white/10 bg-surface px-2 py-1.5 text-xs text-white focus:outline-none"
          aria-label="Record type"
        >
          <option value="DEPOSIT" className="bg-surface">Deposit</option>
          <option value="CASHOUT" className="bg-surface">Cashout</option>
          <option value="ADJUSTMENT" className="bg-surface">Adjustment</option>
        </select>
        <input
          type="number"
          step="0.01"
          value={draft.amount}
          onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
          placeholder="Amount"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white placeholder:text-muted focus:outline-none"
        />
        <input
          value={draft.note}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          placeholder="Note (optional)"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white placeholder:text-muted focus:outline-none"
        />
        <button
          onClick={add}
          disabled={!draft.amount || isSaving}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-nexplay-gradient py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add record
        </button>
      </div>

      {/* History */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted">No records yet.</p>
      ) : (
        <div className="space-y-1.5">
          {records.map((r) => (
            <div key={r.id} className="group flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium",
                    r.type === "DEPOSIT" ? "text-success" : r.type === "CASHOUT" ? "text-danger" : "text-muted"
                  )}
                >
                  {r.type === "CASHOUT" ? "−" : "+"}
                  {formatMinor(r.amountMinor, r.currency)}
                </p>
                <p className="truncate text-[10px] text-muted">
                  {new Date(r.recordedAt).toLocaleDateString()}
                  {r.note && ` · ${r.note}`}
                </p>
              </div>
              <button
                onClick={() => remove(r.id)}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete record"
              >
                <Trash2 className="h-3 w-3 text-muted hover:text-danger" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab({ conversationId }: { conversationId: string }) {
  const [audits, setAudits] = useState<MessageAuditDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    workspaceApi
      .listAudits(conversationId)
      .then(({ data }) => !cancelled && setAudits(data.data.audits))
      .catch(() => !cancelled && setAudits([]))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-2 text-[11px] text-danger">
        <ShieldAlert className="h-3 w-3 shrink-0" />
        Original text of messages deleted for everyone.
      </p>

      {audits.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">No deleted messages in this conversation.</p>
      ) : (
        <div className="space-y-2">
          {audits.map((a) => (
            <div key={a.id} className="rounded-lg border border-white/10 bg-surface/40 p-3">
              <p className="mb-1 text-[10px] text-muted">Deleted {timeAgo(a.createdAt)}</p>
              <p className="whitespace-pre-line break-words text-xs italic text-white/80">{a.originalContent}</p>
              {a.attachmentUrls.length > 0 && (
                <p className="mt-1 text-[10px] text-muted">{a.attachmentUrls.length} attachment(s)</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab({ userId }: { userId: string }) {
  const [related, setRelated] = useState<RelatedAccountDTO[]>([]);
  const [logins, setLogins] = useState<LoginRecordDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([workspaceApi.relatedAccounts(userId), workspaceApi.loginHistory(userId)])
      .then(([rel, log]) => {
        if (cancelled) return;
        setRelated(rel.data.data.related);
        setLogins(log.data.data.history);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overlap signals — explicitly framed as signals, not verdicts.
          Shared IPs are common (households, offices, carrier NAT), so an
          agent needs the reasoning, not a flag. */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white">
          <UserSearch className="h-3.5 w-3.5 text-primary" /> Possibly related accounts
        </p>

        {related.length === 0 ? (
          <p className="rounded-lg bg-white/[0.03] p-3 text-[11px] text-muted">
            No overlapping sign-ins found.
          </p>
        ) : (
          <>
            <p className="mb-2 rounded-lg bg-accent/10 px-2.5 py-2 text-[11px] text-accent">
              Shared connections are common on home and office networks. Treat these as a prompt to look, not proof of
              a duplicate.
            </p>
            <div className="space-y-2">
              {related.map((r) => (
                <div key={r.user.id} className="rounded-lg border border-white/10 bg-surface/40 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-white">{r.user.username}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize",
                        r.confidence === "high"
                          ? "bg-danger/20 text-danger"
                          : r.confidence === "medium"
                            ? "bg-accent/20 text-accent"
                            : "bg-white/10 text-muted"
                      )}
                    >
                      {r.confidence}
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-muted">{r.user.email}</p>
                  <p className="mt-1 text-[10px] text-muted">{r.reasons.join(" · ")}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sign-in history */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white">
          <Monitor className="h-3.5 w-3.5 text-primary" /> Recent sign-ins
        </p>
        {logins.length === 0 ? (
          <p className="rounded-lg bg-white/[0.03] p-3 text-[11px] text-muted">No sign-ins recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {logins.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-white">{l.device ?? "Unknown device"}</p>
                  <p className="text-[10px] text-muted">{l.ipAddress ?? "no IP"}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted">{timeAgo(l.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
