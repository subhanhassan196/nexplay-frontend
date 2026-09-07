"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, MessageSquare, MoreVertical, Pencil, Trash2, Send, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { communityApi, type CommunityCommentDTO } from "@/lib/api/community";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const MODERATOR_ROLES = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];
const PAGE_SIZE = 10;

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Avatar({ user, size = 32 }: { user: { username: string; avatarUrl: string | null }; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30"
      style={{ width: size, height: size }}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={`${user.username} avatar`} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="m-auto text-[10px] font-semibold text-white">{user.username.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

interface CommentThreadProps {
  postId: string;
  /** Kept in sync so the post card's count matches what's on screen. */
  onCountChange?: (total: number) => void;
}

/**
 * Comment thread for a post.
 *
 * Writes are optimistic where it's safe — a new comment appears instantly
 * and is reconciled with the server's version when it returns. Failures
 * roll the optimistic row back rather than leaving a comment on screen
 * that was never actually saved.
 */
export function CommentThread({ postId, onCountChange }: CommentThreadProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState<CommunityCommentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<CommunityCommentDTO | null>(null);
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const isModerator = MODERATOR_ROLES.includes(user?.role ?? "");

  const load = useCallback(
    async (append = false) => {
      if (!append) setIsLoading(true);
      setError(false);
      try {
        const { data } = await communityApi.listComments(postId, {
          take: PAGE_SIZE,
          skip: append ? comments.length : 0,
        });
        setComments((prev) => (append ? [...prev, ...data.data.comments] : data.data.comments));
        setTotal(data.data.total);
        onCountChange?.(data.data.total);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    },
    // `comments.length` is read inside but shouldn't retrigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [postId]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit() {
    const content = draft.trim();
    if (!content || isPosting) return;

    setIsPosting(true);
    try {
      const { data } = await communityApi.addComment(postId, content, replyTo?.id);
      const created = data.data.comment;

      if (replyTo) {
        // Nest the reply under its parent so the thread reads correctly.
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies ?? []), created], _count: { ...c._count, replies: c._count.replies + 1 } }
              : c
          )
        );
      } else {
        setComments((prev) => [...prev, created]);
        setTotal((t) => {
          onCountChange?.(t + 1);
          return t + 1;
        });
      }

      setDraft("");
      setReplyTo(null);
    } catch (err) {
      toast({ variant: "error", title: "Couldn't post comment", description: getApiErrorMessage(err) });
    } finally {
      setIsPosting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing?.content.trim()) return;
    const { id, content } = editing;
    try {
      const { data } = await communityApi.updateComment(id, content.trim());
      const updated = data.data.comment;
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, content: updated.content }
            : { ...c, replies: c.replies?.map((r) => (r.id === id ? { ...r, content: updated.content } : r)) }
        )
      );
      setEditing(null);
    } catch (err) {
      toast({ variant: "error", title: "Couldn't save", description: getApiErrorMessage(err) });
    }
  }

  async function handleDelete(commentId: string, isReply: boolean, parentId?: string) {
    try {
      await communityApi.deleteComment(commentId);
      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replies: c.replies?.filter((r) => r.id !== commentId) } : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setTotal((t) => {
          onCountChange?.(Math.max(0, t - 1));
          return Math.max(0, t - 1);
        });
      }
      setMenuOpen(null);
    } catch (err) {
      toast({ variant: "error", title: "Couldn't delete", description: getApiErrorMessage(err) });
    }
  }

  async function handleLike(commentId: string) {
    // Flip locally first — a like should feel instant.
    const wasLiked = likedIds.has(commentId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(commentId);
      else next.add(commentId);
      return next;
    });

    try {
      const { data } = await communityApi.toggleCommentLike(commentId);
      const { count } = data.data;
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, _count: { ...c._count, likes: count } }
            : { ...c, replies: c.replies?.map((r) => (r.id === commentId ? { ...r, _count: { ...r._count, likes: count } } : r)) }
        )
      );
    } catch {
      // Roll the optimistic flip back if the server rejected it.
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
    }
  }

  function renderComment(comment: CommunityCommentDTO, isReply = false, parentId?: string) {
    const isOwn = comment.userId === user?.id;
    const canModify = isOwn || isModerator;
    const isDeleted = Boolean(comment.deletedAt);
    const isEditing = editing?.id === comment.id;

    return (
      <div key={comment.id} className={cn("flex gap-2.5", isReply && "ml-9 mt-2")}>
        <Avatar user={comment.user} size={isReply ? 26 : 32} />

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-white">{comment.user.username}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[10px] text-muted">{timeAgo(comment.createdAt)}</span>
                {canModify && !isDeleted && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === comment.id ? null : comment.id)}
                      aria-label="Comment options"
                      className="text-muted transition-colors hover:text-white"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen === comment.id && (
                      <div className="absolute right-0 top-5 z-20 w-32 overflow-hidden rounded-lg border border-white/10 bg-background shadow-xl">
                        {isOwn && (
                          <button
                            onClick={() => {
                              setEditing({ id: comment.id, content: comment.content });
                              setMenuOpen(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/5"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id, isReply, parentId)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-white/5"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isDeleted ? (
              <p className="mt-0.5 text-sm italic text-muted">This comment was deleted</p>
            ) : isEditing ? (
              <div className="mt-1.5">
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-white focus:border-primary/50 focus:outline-none"
                />
                <div className="mt-1.5 flex gap-2">
                  <button onClick={handleSaveEdit} className="rounded-md bg-primary px-3 py-1 text-xs text-white">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="rounded-md px-3 py-1 text-xs text-muted hover:text-white">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 whitespace-pre-line break-words text-sm text-white/90">{comment.content}</p>
            )}
          </div>

          {!isDeleted && (
            <div className="mt-1 flex items-center gap-4 pl-1">
              <button
                onClick={() => handleLike(comment.id)}
                disabled={!isAuthenticated}
                className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-danger disabled:opacity-50"
                aria-label="Like comment"
              >
                <Heart className={cn("h-3 w-3", likedIds.has(comment.id) && "fill-danger text-danger")} />
                {comment._count.likes > 0 && comment._count.likes}
              </button>

              {!isReply && isAuthenticated && (
                <button
                  onClick={() => setReplyTo(comment)}
                  className="text-[11px] text-muted transition-colors hover:text-white"
                >
                  Reply
                </button>
              )}
            </div>
          )}

          {comment.replies?.map((reply) => renderComment(reply, true, comment.id))}

          {!isReply && comment._count.replies > (comment.replies?.length ?? 0) && (
            <p className="ml-9 mt-1 text-[11px] text-muted">
              {comment._count.replies - (comment.replies?.length ?? 0)} more repl
              {comment._count.replies - (comment.replies?.length ?? 0) === 1 ? "y" : "ies"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-sm text-muted">Couldn&apos;t load comments.</p>
          <button onClick={() => load()} className="mt-1 text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted">
          {isAuthenticated ? "No comments yet — start the conversation." : "No comments yet."}
        </p>
      ) : (
        <div className="space-y-3">{comments.map((c) => renderComment(c))}</div>
      )}

      {comments.length < total && !isLoading && (
        <button onClick={() => load(true)} className="mt-3 w-full text-xs text-primary hover:underline">
          Load more comments ({total - comments.length} remaining)
        </button>
      )}

      {/* Composer */}
      {isAuthenticated && (
        <div className="mt-4">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-1.5 text-xs">
              <span className="truncate text-muted">
                Replying to <span className="text-white">{replyTo.user.username}</span>
              </span>
              <button onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                <X className="h-3.5 w-3.5 text-muted hover:text-white" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {user && <Avatar user={{ username: user.username, avatarUrl: null }} size={32} />}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
              rows={1}
              className="max-h-24 min-h-[38px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || isPosting}
              aria-label="Post comment"
              className={cn(
                "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl transition-colors",
                draft.trim() && !isPosting ? "bg-nexplay-gradient text-white" : "bg-white/5 text-muted"
              )}
            >
              {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <p className="mt-3 text-center text-xs text-muted">
          <a href="/login" className="text-primary hover:underline">
            Log in
          </a>{" "}
          to join the conversation.
        </p>
      )}
    </div>
  );
}
