"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Search, Trash2, RotateCcw, MessageSquare, Heart, ShieldAlert, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { adminCommunityApi, type CommunityPostDTO } from "@/lib/api/community";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Community moderation.
 *
 * Removals are soft — a deleted post stays in the table (greyed out) and
 * can be restored, and every removal is written to the audit log with the
 * moderator's identity. That matters when a takedown is disputed later.
 */
export default function AdminCommunityPage() {
  const { toast } = useToast();

  const [posts, setPosts] = useState<CommunityPostDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [confirming, setConfirming] = useState<CommunityPostDTO | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminCommunityApi.listPosts({
        take: PAGE_SIZE,
        search: search || undefined,
        includeDeleted,
      });
      setPosts(data.data.posts);
      setTotal(data.data.total);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, includeDeleted]);

  useEffect(() => {
    // Debounce so typing in the search box doesn't fire a request per keystroke.
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete() {
    if (!confirming) return;
    try {
      await adminCommunityApi.deletePost(confirming.id, reason.trim() || undefined);
      setPosts((prev) =>
        prev.map((p) => (p.id === confirming.id ? { ...p, deletedAt: new Date().toISOString() } : p))
      );
      setConfirming(null);
      setReason("");
      toast({ variant: "success", title: "Post removed" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't remove", description: getApiErrorMessage(err) });
    }
  }

  async function handleRestore(post: CommunityPostDTO) {
    try {
      await adminCommunityApi.restorePost(post.id);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, deletedAt: null } : p)));
      toast({ variant: "success", title: "Post restored" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't restore", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Community Moderation</h1>
        <p className="text-sm text-muted">
          {total} posts. Removals are reversible and recorded in the audit log.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search post content or author…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Show removed
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No posts found.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const isRemoved = Boolean(post.deletedAt);
            return (
              <GlassPanel key={post.id} className={cn("p-4", isRemoved && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30">
                    {post.user.avatarUrl ? (
                      <Image
                        src={post.user.avatarUrl}
                        alt={`${post.user.username} avatar`}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="m-auto text-[10px] font-semibold text-white">
                        {post.user.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{post.user.username}</span>
                      <span className="text-xs text-muted">{formatDate(post.createdAt)}</span>
                      {isRemoved && (
                        <span className="flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-[10px] text-danger">
                          <ShieldAlert className="h-2.5 w-2.5" /> Removed
                        </span>
                      )}
                    </div>

                    <p className={cn("mt-1 line-clamp-3 text-sm", isRemoved ? "text-muted line-through" : "text-white/90")}>
                      {post.content}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {post._count.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post._count.comments}
                      </span>
                      {post.game && <span>{post.game.title}</span>}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isRemoved ? (
                      <button
                        onClick={() => handleRestore(post)}
                        className="rounded-lg p-2 text-muted transition-colors hover:text-success"
                        title="Restore post"
                        aria-label="Restore post"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirming(post)}
                        className="rounded-lg p-2 text-muted transition-colors hover:text-danger"
                        title="Remove post"
                        aria-label="Remove post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* Removal confirmation — destructive actions shouldn't be one click */}
      {confirming && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirming(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm post removal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Remove this post?</h2>
              <button onClick={() => setConfirming(null)} aria-label="Cancel">
                <X className="h-5 w-5 text-muted hover:text-white" />
              </button>
            </div>

            <p className="mb-2 text-sm text-muted">
              It will be hidden from the public feed. You can restore it later, and the action is recorded in the
              audit log.
            </p>

            <div className="mb-4 rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-xs text-muted">{confirming.user.username}</p>
              <p className="line-clamp-3 text-sm text-white/90">{confirming.content}</p>
            </div>

            <label htmlFor="reason" className="mb-1 block text-xs text-muted">
              Reason (optional)
            </label>
            <input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. spam, harassment"
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Remove post
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
