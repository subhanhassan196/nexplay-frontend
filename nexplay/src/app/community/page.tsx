"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MessageSquare, Heart, Plus, Send, X, Loader2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/StateScreens";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { communityApi, type CommunityPostDTO } from "@/lib/api/community";
import { getApiErrorMessage } from "@/lib/api/axios";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Community feed. Posts are real records written by real accounts —
 * an empty feed shows an empty state rather than sample conversations.
 */
export default function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<CommunityPostDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ content: "" });
  const [isPosting, setIsPosting] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await communityApi.listPosts({ take: 30 });
      setPosts(data.data.posts);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost() {
    if (!draft.content.trim()) return;
    setIsPosting(true);
    try {
      await communityApi.createPost(draft);
      setDraft({ content: "" });
      setComposing(false);
      await load();
      toast({ variant: "success", title: "Posted!" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't post", description: getApiErrorMessage(err) });
    } finally {
      setIsPosting(false);
    }
  }

  async function handleLike(post: CommunityPostDTO) {
    try {
      const { data } = await communityApi.toggleLike(post.id);
      setLiked((prev) => ({ ...prev, [post.id]: data.data.liked }));
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, _count: { ...p._count, likes: data.data.count } } : p))
      );
    } catch (err) {
      toast({ variant: "error", title: "Couldn't update", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="container-nexplay section-padding pt-32">
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
            className="flex items-center gap-2 rounded-xl bg-nexplay-gradient px-5 py-2.5 font-medium text-white hover:opacity-90"
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
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            placeholder="What's on your mind?"
            rows={4}
            className="mb-3 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={handlePost}
            disabled={isPosting || !draft.content.trim()}
            className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isPosting ? "Posting…" : "Post"}
          </button>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description={isAuthenticated ? "Be the first to start a conversation." : "Log in to start a conversation."}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <GlassPanel key={post.id} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30">
                  {post.user.avatarUrl ? (
                    <Image src={post.user.avatarUrl} alt={`${post.user.username} avatar`} fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="m-auto text-xs font-semibold text-white">
                      {post.user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{post.user.username}</p>
                  <p className="text-xs text-muted">
                    {timeAgo(post.createdAt)}
                    {post.game && ` · ${post.game.title}`}
                  </p>
                </div>
              </div>

              <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{post.content}</p>

              <div className="mt-4 flex items-center gap-5 border-t border-white/5 pt-3 text-sm">
                <button
                  onClick={() => handleLike(post)}
                  disabled={!isAuthenticated}
                  className="flex items-center gap-1.5 text-muted transition-colors hover:text-danger disabled:opacity-50"
                  aria-label="Like post"
                >
                  <Heart className={liked[post.id] ? "h-4 w-4 fill-danger text-danger" : "h-4 w-4"} />
                  {post._count.likes}
                </button>
                <span className="flex items-center gap-1.5 text-muted">
                  <MessageSquare className="h-4 w-4" />
                  {post._count.comments}
                </span>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
