"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Pin,
  PinOff,
  CheckCircle2,
  Archive,
  Trash2,
  Send,
  Clock,
  Circle,
  Headset,
  Bot,
  Gamepad2,
  Link as LinkIcon,
  Copy,
  Check,
  ArrowLeft,
  UserSearch,
  X,
  ShieldAlert,
} from "lucide-react";
import { adminSupportApi, type AdminConversationDTO } from "@/lib/api/adminSupport";
import { agentsApi, bulkApi } from "@/lib/api/search";
import { type MessageDTO, type ConversationState } from "@/lib/api/messenger";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { CustomerPanel } from "@/components/admin/CustomerPanel";
import { workspaceApi } from "@/lib/api/workspace";
import { AgentComposer } from "@/components/admin/AgentComposer";
import { api } from "@/lib/api/axios";
import type { UploadedAttachment } from "@/lib/api/messenger";
import { MessageAttachments } from "@/components/messenger/MessageAttachments";
import { cn } from "@/lib/utils";

const stateFilters: { label: string; value: ConversationState | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Pending", value: "PENDING" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Archived", value: "ARCHIVED" },
];

const stateBadge: Record<ConversationState, string> = {
  OPEN: "bg-success/15 text-success",
  PENDING: "bg-accent/15 text-accent",
  RESOLVED: "bg-secondary/15 text-secondary",
  ARCHIVED: "bg-white/10 text-muted",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function AdminConversationsPage() {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<AdminConversationDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [activeConversation, setActiveConversation] = useState<AdminConversationDTO | null>(null);
  const [filter, setFilter] = useState<ConversationState | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "priority" | "waiting">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<{ id: string; username: string }[]>([]);
  // The signed-in agent's personal support link, minted on first view.
  const [myLink, setMyLink] = useState<string | null>(null);
  /// On phones only one panel fits at a time, so the inbox behaves like a
  /// mail app: pick a conversation, drill in, come back. Desktop shows
  /// all three columns at once.
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [panelOpen, setPanelOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userTyping, setUserTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await adminSupportApi.listConversations({
        limit: 50,
        state: filter === "ALL" ? undefined : filter,
        search: search || undefined,
        sort,
      });
      setConversations(data.data);
      if (!activeId && data.data.length > 0) setActiveId(data.data[0].id);
    } catch {
      setConversations([]);
    } finally {
      setIsLoadingList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, sort]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // The agent's own support link — customers who open it land directly
  // in this agent's queue.
  useEffect(() => {
    workspaceApi
      .myAgentLink()
      .then(({ data }) => setMyLink(`${window.location.origin}/support/${data.data.link.slug}`))
      .catch(() => undefined);
  }, []);

  // Load agents once for the assignment dropdown.
  useEffect(() => {
    agentsApi
      .list()
      .then(({ data }) => setAgents(data.data.agents))
      .catch(() => undefined);
  }, []);

  // Load active thread
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setIsLoadingThread(true);
    (async () => {
      try {
        const { data } = await adminSupportApi.getConversation(activeId, { limit: 100 });
        if (cancelled) return;
        setActiveConversation(data.data.conversation);
        setMessages(data.data.messages);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIsLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Real-time: join active conversation room + listen for new/updated messages.
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (payload: { conversationId: string; message: MessageDTO }) => {
      // If it's the open thread, append live.
      if (payload.conversationId === activeId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
      }
      // Bump the conversation to the top of the list with a fresh preview.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? { ...c, lastMessagePreview: payload.message.content, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    };

    const handleTyping = (payload: { conversationId: string; typing: boolean }) => {
      if (payload.conversationId === activeId) setUserTyping(payload.typing);
    };

    const handleConversationUpdated = () => {
      // A ticket's state/assignment changed elsewhere — refresh the list.
      loadConversations();
    };

    if (activeId) socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, activeId);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, handleConversationUpdated);

    return () => {
      if (activeId) socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, activeId);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.TYPING, handleTyping);
      socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED, handleConversationUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  async function handleReply() {
    if (!activeId || !reply.trim()) return;
    setIsSending(true);
    try {
      const { data } = await adminSupportApi.reply(activeId, reply.trim());
      setMessages((prev) => [...prev, data.data.message]);
      setReply("");
      getSocket().emit(SOCKET_EVENTS.TYPING_STOP, activeId);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    } catch (err) {
      toast({ variant: "error", title: "Reply failed", description: getApiErrorMessage(err) });
    } finally {
      setIsSending(false);
    }
  }

  async function handleState(state: ConversationState) {
    if (!activeId) return;
    try {
      await adminSupportApi.setState(activeId, state);
      setActiveConversation((prev) => (prev ? { ...prev, state } : prev));
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, state } : c)));
      toast({ variant: "success", title: `Marked ${state.toLowerCase()}` });
    } catch (err) {
      toast({ variant: "error", title: "Update failed", description: getApiErrorMessage(err) });
    }
  }

  /** Uploads an agent attachment through the validated chat pipeline. */
  async function uploadAgentFile(file: File, durationSeconds?: number) {
    const form = new FormData();
    form.append("file", file);
    if (durationSeconds !== undefined) form.append("durationSeconds", String(Math.round(durationSeconds)));
    const { data } = await api.post<{ data: { attachment: UploadedAttachment } }>("/admin/support/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data.attachment;
  }

  async function handleAgentSend(content: string, attachments?: UploadedAttachment[]) {
    if (!activeId) return;
    setIsSending(true);
    try {
      const { data } = await adminSupportApi.reply(activeId, content, attachments);
      setMessages((prev) => [...prev, data.data.message]);
      getSocket().emit(SOCKET_EVENTS.TYPING_STOP, activeId);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    } catch (err) {
      toast({ variant: "error", title: "Reply failed", description: getApiErrorMessage(err) });
      throw err;
    } finally {
      setIsSending(false);
    }
  }

  async function handleTicketUpdate(data: { priority?: string; category?: string; tags?: string[]; resolutionNotes?: string }) {
    if (!activeConversation) return;
    try {
      const { data: res } = await adminSupportApi.updateTicket(activeConversation.id, data);
      setActiveConversation(res.data.conversation);
      setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? res.data.conversation : c)));
      toast({ variant: "success", title: "Ticket updated" });
    } catch (err) {
      toast({ variant: "error", title: "Update failed", description: getApiErrorMessage(err) });
    }
  }

  async function handlePin() {
    if (!activeConversation) return;
    try {
      const next = !activeConversation.isPinned;
      await adminSupportApi.setPinned(activeConversation.id, next);
      setActiveConversation({ ...activeConversation, isPinned: next });
      setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? { ...c, isPinned: next } : c)));
    } catch (err) {
      toast({ variant: "error", title: "Update failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleDelete() {
    if (!activeId) return;
    try {
      await adminSupportApi.deleteConversation(activeId);
      setConversations((prev) => prev.filter((c) => c.id !== activeId));
      setActiveId(null);
      setActiveConversation(null);
      setMessages([]);
      toast({ variant: "success", title: "Conversation deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Delete failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleAssign(agentId: string | null) {
    if (!activeConversation) return;
    try {
      const { data } = await adminSupportApi.assign(activeConversation.id, agentId);
      setActiveConversation(data.data.conversation);
      setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? data.data.conversation : c)));
      toast({ variant: "success", title: agentId ? "Assigned" : "Unassigned" });
    } catch (err) {
      toast({ variant: "error", title: "Assign failed", description: getApiErrorMessage(err) });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkState(state: ConversationState) {
    if (selectedIds.size === 0) return;
    try {
      await bulkApi.setState([...selectedIds], state);
      setSelectedIds(new Set());
      await loadConversations();
      toast({ variant: "success", title: `${selectedIds.size} tickets updated` });
    } catch (err) {
      toast({ variant: "error", title: "Bulk update failed", description: getApiErrorMessage(err) });
    }
  }

  async function handleBulkAssign(agentId: string | null) {
    if (selectedIds.size === 0) return;
    try {
      await bulkApi.assign([...selectedIds], agentId);
      setSelectedIds(new Set());
      await loadConversations();
      toast({ variant: "success", title: "Bulk assignment applied" });
    } catch (err) {
      toast({ variant: "error", title: "Bulk assign failed", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="flex h-[calc(100dvh-3.75rem)] overflow-hidden">
      {/* Conversation list */}
      <div
        className={cn(
          "flex flex-col border-r border-white/10 md:w-80 md:shrink-0",
          mobileView === "list" ? "w-full" : "hidden md:flex"
        )}
      >
        <div className="border-b border-white/10 p-4">
          <h1 className="mb-3 font-display text-lg font-bold text-white">Conversations</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
          </div>
          {myLink && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(myLink);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 1800);
              }}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-2 text-left text-[11px] text-white transition-colors hover:bg-primary/15"
              title="Copy your personal support link"
            >
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{linkCopied ? "Link copied!" : "My support link"}</span>
              {linkCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
            </button>
          )}

          <div className="flex flex-wrap gap-1.5">
            {stateFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  filter === f.value
                    ? "border-primary/50 bg-primary/15 text-white"
                    : "border-white/10 text-muted hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-surface px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="newest" className="bg-surface">Newest first</option>
            <option value="oldest" className="bg-surface">Oldest first</option>
            <option value="priority" className="bg-surface">Priority (high → low)</option>
            <option value="waiting" className="bg-surface">Longest waiting</option>
          </select>

          {/* Bulk action bar (only when tickets are selected) */}
          {selectedIds.size > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 p-2">
              <span className="text-xs font-medium text-white">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkState("RESOLVED")} className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20">
                Resolve
              </button>
              <button onClick={() => handleBulkState("ARCHIVED")} className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20">
                Archive
              </button>
              <select
                onChange={(e) => e.target.value && handleBulkAssign(e.target.value === "none" ? null : e.target.value)}
                defaultValue=""
                className="rounded-md border border-white/10 bg-surface px-1.5 py-1 text-[10px] text-white focus:outline-none"
              >
                <option value="" disabled className="bg-surface">Assign to…</option>
                <option value="none" className="bg-surface">Unassign</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id} className="bg-surface">
                    {a.username}
                  </option>
                ))}
              </select>
              <button onClick={() => setSelectedIds(new Set())} className="rounded-md px-2 py-1 text-[10px] text-muted hover:text-white">
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">No conversations.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "flex w-full items-start gap-2 border-b border-white/5 p-3 transition-colors hover:bg-white/[0.03]",
                  activeId === c.id && "bg-white/[0.05]"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  aria-label="Select ticket"
                />
                <button
                  onClick={() => {
                    setActiveId(c.id);
                    setMobileView("thread");
                  }}
                  className="flex flex-1 items-start gap-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexplay-gradient/20 text-sm font-semibold text-primary">
                    {c.user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 truncate text-sm font-medium text-white">
                        {c.isPinned && <Pin className="h-3 w-3 text-accent" />}
                        {c.user.username}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-xs text-muted">{c.lastMessagePreview || "No messages yet"}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-muted">#{c.ticketNumber}</span>
                      {c.lastGameTitle && (
                        <span className="truncate rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                          {c.lastGameTitle}
                        </span>
                      )}
                      <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[10px]", stateBadge[c.state])}>
                        {c.state.toLowerCase()}
                      </span>
                      {c.assignedAgent && (
                        <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-[10px] text-secondary">
                          {c.assignedAgent.username}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={cn("flex flex-1 flex-col", mobileView === "thread" ? "flex" : "hidden md:flex")}>
        {!activeConversation ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Select a conversation to view.
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex flex-col gap-2 border-b border-white/10 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  {/* Back to the list — phones show one panel at a time. */}
                  <button
                    onClick={() => setMobileView("list")}
                    className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-white md:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexplay-gradient/20 text-sm font-semibold text-primary">
                    {activeConversation.user.username.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{activeConversation.user.username}</p>
                    <p className="truncate text-xs text-muted">{activeConversation.user.email}</p>
                  </div>
                </div>

                {/* Quick actions — always visible, never squeezed by the header text. */}
                <div className="flex shrink-0 items-center gap-1">
                  {/* Customer context — a drawer on anything narrower than a
                      desktop, where the third column doesn't fit. */}
                  <button
                    onClick={() => setPanelOpen(true)}
                    className="admin-action-btn 2xl:hidden"
                    aria-label="Customer details"
                    title="Customer details"
                  >
                    <UserSearch className="h-4 w-4" />
                  </button>
                  <button onClick={handlePin} className="admin-action-btn" aria-label="Pin">
                    {activeConversation.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleState("PENDING")} className="admin-action-btn" aria-label="Pending">
                    <Clock className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleState("RESOLVED")} className="admin-action-btn" aria-label="Resolve">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleState("ARCHIVED")} className="admin-action-btn" aria-label="Archive">
                    <Archive className="h-4 w-4" />
                  </button>
                  <button onClick={handleDelete} className="admin-action-btn hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Ticket meta row — wraps freely instead of overlapping the name/email above. */}
              <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-[calc(2.25rem+0.75rem)]">
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  #{activeConversation.ticketNumber}
                </span>
                {activeConversation.lastGameTitle && (
                  <span
                    className="flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                    title="Game the user opened support from"
                  >
                    <Gamepad2 className="h-2.5 w-2.5" />
                    {activeConversation.lastGameTitle}
                  </span>
                )}
                <select
                  value={activeConversation.priority}
                  onChange={(e) => handleTicketUpdate({ priority: e.target.value })}
                  className="rounded-md border border-white/10 bg-surface px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                >
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p} className="bg-surface">
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={activeConversation.category}
                  onChange={(e) => handleTicketUpdate({ category: e.target.value })}
                  className="rounded-md border border-white/10 bg-surface px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                >
                  {["GENERAL", "ACCOUNT", "BILLING", "TECHNICAL", "GAME_ACCESS", "BUG_REPORT", "FEEDBACK"].map((c) => (
                    <option key={c} value={c} className="bg-surface">
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <select
                  value={activeConversation.assignedAgent?.id ?? ""}
                  onChange={(e) => handleAssign(e.target.value || null)}
                  className="rounded-md border border-white/10 bg-surface px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                  aria-label="Assign agent"
                >
                  <option value="" className="bg-surface">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} className="bg-surface">
                      {a.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {isLoadingThread ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn("h-10 w-2/3 animate-pulse rounded-2xl bg-white/5", i % 2 && "ml-auto")} />
                  ))}
                </div>
              ) : (
                messages.map((m) => {
                  const isAgent = m.senderType === "AGENT";
                  const isSystem = m.senderType === "SYSTEM" || m.senderType === "BOT";
                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center py-2">
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">{m.content}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className={cn("flex gap-2 py-1", isAgent && "flex-row-reverse")}>
                      <span
                        className={cn(
                          "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          isAgent ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                        )}
                      >
                        {isAgent ? <Headset className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </span>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                          isAgent
                            ? "rounded-tr-sm bg-nexplay-gradient text-white"
                            : "rounded-tl-sm border border-white/10 bg-white/[0.05] text-white/90",
                          m.deletedAt && "italic opacity-60"
                        )}
                      >
                        {/* Attachments — image, document or voice note */}
                        {!m.deletedAt && m.attachments?.length > 0 && (
                          <MessageAttachments attachments={m.attachments} isMine={isAgent} />
                        )}

                        {/* Legacy URL-only attachments */}
                        {!m.deletedAt && m.attachments?.length === 0 && m.attachmentUrls?.length > 0 && (
                          <div className="mb-1.5 flex flex-col gap-1.5">
                            {m.attachmentUrls.map((url) => (
                              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="Message attachment" loading="lazy" className="max-h-56 w-full max-w-[240px] object-cover" />
                              </a>
                            ))}
                          </div>
                        )}

                        {m.deletedAt ? (
                          /* Agents see what was actually said. The customer's
                             view still shows it as deleted — this is the
                             moderation record, not a bypass of the delete. */
                          <span className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-danger">
                              <ShieldAlert className="h-3 w-3" /> Deleted by sender
                            </span>
                            <span className="italic opacity-80">{m.content || "(original text in the Audit tab)"}</span>
                          </span>
                        ) : (
                          m.content
                        )}

                        {/* Which game this message came from */}
                        {!m.deletedAt && m.gameTitle && (
                          <span
                            className={cn(
                              "mt-1.5 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                              isAgent ? "bg-white/20 text-white/90" : "bg-primary/15 text-primary"
                            )}
                          >
                            <Gamepad2 className="h-2.5 w-2.5" />
                            {m.gameTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {userTyping && (
                <div className="flex items-center gap-2 py-2 pl-9 text-xs text-muted">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                  {activeConversation.user.username} is typing…
                </div>
              )}
            </div>

            {/* Reply box — same attachment tools the customer has. */}
            <AgentComposer
              onSend={handleAgentSend}
              onUploadFile={uploadAgentFile}
              onTyping={(typing) => {
                if (!activeId) return;
                getSocket().emit(typing ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP, activeId);
              }}
              disabled={isSending}
            />
          </>
        )}
      </div>

      {/* Customer context — a column on desktop, a slide-over on
          anything narrower, so agents keep it on phones and tablets. */}
      {activeConversation && (
        <>
          {/* Only pinned open once there's genuinely room for four columns
              (sidebar + list + thread + rail). Below that the thread gets
              squeezed to nothing, so the panel becomes a slide-over. */}
          <div className="hidden 2xl:flex">
            <CustomerPanel
              conversationId={activeConversation.id}
              userId={activeConversation.user.id}
              username={activeConversation.user.username}
            />
          </div>

          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPanelOpen(false)}
                className="fixed inset-0 z-[80] bg-black/60 2xl:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Customer details"
              >
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 34 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-0 flex h-full max-w-[92vw] bg-background shadow-2xl"
                >
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="absolute left-2 top-2 z-10 rounded-lg p-2 text-muted hover:text-white"
                    aria-label="Close details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CustomerPanel
                    conversationId={activeConversation.id}
                    userId={activeConversation.user.id}
                    username={activeConversation.user.username}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

    </div>
  );
}
