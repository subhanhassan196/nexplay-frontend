"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MessageSquare, Heart, Plus, Send, X, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/StateScreens";
import { CommentThread } from "@/components/community/CommentThread";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { communityApi, type CommunityPostDTO } from "@/lib/api/community";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const MODERATOR_ROLES = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];
const PAGE_SIZE = 15;

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Community feed. Posts, likes and comments are all real records — an
 * empty feed shows an empty state rather than sample conversations.
 *
 * Ownership actions (edit/delete) are shown only to the author or a
 * moderator, but the real check happens server-side; the UI is just
 * saving people from clicking something that would fail.
 */
export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<CommunityPostDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const isModerator = MODERATOR_ROLES.includes(user?.role ?? "");

  const load = useCallback(async (append = false, currentCount = 0) => {
    if (!append) setIsLoading(true);
    setError(false);
    try {
      const { data } = await communityApi.listPosts({ take: PAGE_SIZE, skip: append ? currentCount : 0 });
      setPosts((prev) => (append ? [...prev, ...data.data.posts] : data.data.posts));
      setTotal(data.data.total);
      setLiked(new Set(data.data.likedPostIds));
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost() {
    const content = draft.trim();
    if (!content || isPosting) return;
    setIsPosting(true);
    try {
      const { data } = await communityApi.createPost({ content });
      setPosts((prev) => [data.data.post, ...prev]);
      setTotal((t) => t + 1);
      setDraft("");
      setComposing(false);
      toast({ variant: "success", title: "Posted!" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't post", description: getApiErrorMessage(err) });
    } finally {
      setIsPosting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing?.content.trim()) return;
    try {
      const { data } = await communityApi.updatePost(editing.id, editing.content.trim());
      setPosts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, content: data.data.post.content } : p)));
      setEditing(null);
      toast({ variant: "success", title: "Post updated" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't update", description: getApiErrorMessage(err) });
    }
  }

  async function handleDelete(id: string) {
    try {
      await communityApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      setMenuOpen(null);
      toast({ variant: "success", title: "Post deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't delete", description: getApiErrorMessage(err) });
    }
  }

  async function handleLike(post: CommunityPostDTO) {
    // Flip locally first so the heart responds immediately.
    const wasLiked = liked.has(post.id);
    setLiked((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(post.id);
      else next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, _count: { ...p._count, likes: p._count.likes + (wasLiked ? -1 : 1) } } : p
      )
    );

    try {
      const { data } = await communityApi.toggleLike(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, _count: { ...p._count, likes: data.data.count } } : p))
      );
    } catch (err) {
      // Undo the optimistic change — the server didn't accept it.
      setLiked((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, _count: { ...p._count, likes: p._count.likes + (wasLiked ? 1 : -1) } } : p
        )
      );
      toast({ variant: "error", title: "Couldn't update like", description: getApiErrorMessage(err) });
    }
  }

  function toggleComments(postId: string) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  return (
    <div className="container-nexplay section-padding pt-28 sm:pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Community"
          title="Player"
          highlight="Feed"
          description="Share strategies, ask questions and connect with other players."
        />
        {isAuthenticated && (
          <button
            onClick={() => setComposing((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-nexplay-gradient px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Post
          </button>
        )}
      </div>

      {composing && (
        <GlassPanel className="mb-6 border-primary/30 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">Create a post</h2>
            <button onClick={() => setComposing(false)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={5000}
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{draft.length}/5000</span>
            <button
              onClick={handlePost}
              disabled={isPosting || !draft.trim()}
              className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isPosting ? "Posting…" : "Post"}
            </button>
          </div>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <GlassPanel className="p-10 text-center">
          <p className="text-sm text-muted">Couldn&apos;t load the feed.</p>
          <button onClick={() => load()} className="mt-2 text-sm text-primary hover:underline">
            Try again
          </button>
        </GlassPanel>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description={isAuthenticated ? "Be the first to start a conversation." : "Log in to start a conversation."}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isOwn = post.userId === user?.id;
            const canModify = isOwn || isModerator;
            const isEditing = editing?.id === post.id;

            return (
              <GlassPanel key={post.id} className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30">
                    {post.user.avatarUrl ? (
                      <Image
                        src={post.user.avatarUrl}
                        alt={`${post.user.username} avatar`}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="m-auto text-xs font-semibold text-white">
                        {post.user.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{post.user.username}</p>
                    <p className="text-xs text-muted">
                      {timeAgo(post.createdAt)}
                      {post.game && ` · ${post.game.title}`}
                    </p>
                  </div>

                  {canModify && (
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        aria-label="Post options"
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === post.id && (
                        <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-white/10 bg-background shadow-xl">
                          {isOwn && (
                            <button
                              onClick={() => {
                                setEditing({ id: post.id, content: post.content });
                                setMenuOpen(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-white/5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="rounded-lg bg-nexplay-gradient px-4 py-1.5 text-sm text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="rounded-lg px-4 py-1.5 text-sm text-muted hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line break-words text-sm leading-relaxed text-white/90">
                    {post.content}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-5 border-t border-white/5 pt-3 text-sm">
                  <button
                    onClick={() => handleLike(post)}
                    disabled={!isAuthenticated}
                    className="flex items-center gap-1.5 text-muted transition-colors hover:text-danger disabled:opacity-50"
                    aria-label="Like post"
                    aria-pressed={liked.has(post.id)}
                  >
                    <Heart className={cn("h-4 w-4", liked.has(post.id) && "fill-danger text-danger")} />
                    {post._count.likes}
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors hover:text-white",
                      openComments.has(post.id) ? "text-primary" : "text-muted"
                    )}
                    aria-expanded={openComments.has(post.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post._count.comments}
                  </button>
                </div>

                {openComments.has(post.id) && (
                  <CommentThread
                    postId={post.id}
                    onCountChange={(count) =>
                      setPosts((prev) =>
                        prev.map((p) => (p.id === post.id ? { ...p, _count: { ...p._count, comments: count } } : p))
                      )
                    }
                  />
                )}
              </GlassPanel>
            );
          })}

          {posts.length < total && (
            <button
              onClick={() => load(true, posts.length)}
              className="w-full rounded-xl border border-white/10 py-3 text-sm text-muted transition-colors hover:text-white"
            >
              Load more posts ({total - posts.length} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
