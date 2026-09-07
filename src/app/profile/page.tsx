"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Loader2,
  Save,
  Trophy,
  Coins,
  Gamepad2,
  Calendar,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { profileApi, type ProfileDTO } from "@/lib/api/profile";
import { rewardsApi } from "@/lib/api/platform";
import { communityApi, type CommunityPostDTO } from "@/lib/api/community";
import { getApiErrorMessage } from "@/lib/api/axios";
import { formatCompactNumber, cn } from "@/lib/utils";

/** Matches what the server accepts — checked again there, this is just UX. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 5;

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * The signed-in user's profile.
 *
 * The avatar upload runs the full pipeline: client-side validation for
 * fast feedback, then a real multipart upload that the server validates
 * again and stores. The returned URL replaces the preview, so what you
 * see after uploading is the stored image — not a local blob that would
 * vanish on refresh.
 */
export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [posts, setPosts] = useState<CommunityPostDTO[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState({ displayName: "", bio: "", country: "" });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [profileRes, balanceRes] = await Promise.all([
        profileApi.getMyProfile(),
        rewardsApi.balance().catch(() => null),
      ]);

      const p = profileRes.data.data.profile;
      setProfile(p);
      setForm({ displayName: p.displayName ?? "", bio: p.bio ?? "", country: p.country ?? "" });
      if (balanceRes) setBalance(balanceRes.data.data.balance);

      if (user?.id) {
        const postsRes = await communityApi.listPosts({ author: user.id, take: 5 });
        setPosts(postsRes.data.data.posts);
      }
    } catch {
      /* leave empty state */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Release the preview object URL when it's replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Image must be under ${MAX_MB}MB.`);
      return;
    }

    // Show the local file straight away so the change feels immediate,
    // then swap in the stored URL once the server confirms it.
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setIsUploading(true);

    try {
      const { data } = await profileApi.uploadAvatar(file);
      setProfile(data.data.profile);
      setPreview(null);
      URL.revokeObjectURL(localPreview);
      toast({ variant: "success", title: "Avatar updated" });
    } catch (err) {
      setPreview(null);
      URL.revokeObjectURL(localPreview);
      setUploadError(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const { data } = await profileApi.updateProfile({
        displayName: form.displayName.trim() || undefined,
        bio: form.bio.trim() || undefined,
        country: form.country.trim() || undefined,
      });
      setProfile(data.data.profile);
      toast({ variant: "success", title: "Profile saved" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't save", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container-nexplay section-padding pt-28 sm:pt-32">
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container-nexplay section-padding pt-28 sm:pt-32">
        <GlassPanel className="p-12 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="mb-4 text-white">You need to be logged in to view your profile.</p>
          <Link href="/login" className="rounded-xl bg-nexplay-gradient px-6 py-2.5 text-sm font-medium text-white">
            Log in
          </Link>
        </GlassPanel>
      </div>
    );
  }

  const avatarSrc = preview ?? profile?.avatarUrl ?? null;

  return (
    <div className="container-nexplay section-padding pt-28 sm:pt-32">
      <SectionHeading eyebrow="Account" title="Your" highlight="Profile" className="mb-8" />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Identity card */}
        <div className="space-y-6">
          <GlassPanel className="p-6 text-center">
            <div className="relative mx-auto mb-4 h-28 w-28">
              <span className="relative flex h-28 w-28 overflow-hidden rounded-full bg-nexplay-gradient/30 ring-2 ring-white/10">
                {avatarSrc ? (
                  <Image src={avatarSrc} alt="Your avatar" fill sizes="112px" className="object-cover" unoptimized={Boolean(preview)} />
                ) : (
                  <span className="m-auto font-display text-3xl font-bold text-white/70">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {isUploading && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </span>
                )}
              </span>

              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                aria-label="Change avatar"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-nexplay-gradient text-white transition-transform hover:scale-105 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarPick}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>

            <h2 className="font-display text-xl font-bold text-white">
              {profile?.displayName || user?.username}
            </h2>
            <p className="text-sm text-muted">@{user?.username}</p>

            {uploadError && (
              <p role="alert" className="mt-3 text-xs text-danger">
                {uploadError}
              </p>
            )}

            <p className="mt-2 text-[11px] text-muted/70">JPEG, PNG or WebP · max {MAX_MB}MB</p>
          </GlassPanel>

          {/* Stats */}
          <GlassPanel className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-white">At a glance</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted">
                  <Coins className="h-4 w-4 text-accent" /> Coins
                </dt>
                <dd className="font-medium text-white">{formatCompactNumber(balance)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted">
                  <MessageSquare className="h-4 w-4 text-primary" /> Posts
                </dt>
                <dd className="font-medium text-white">{posts.length}</dd>
              </div>
              {profile?.createdAt && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted">
                    <Calendar className="h-4 w-4 text-secondary" /> Joined
                  </dt>
                  <dd className="font-medium text-white">
                    {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </dd>
                </div>
              )}
            </dl>
          </GlassPanel>
        </div>

        {/* Edit + activity */}
        <div className="space-y-6">
          <GlassPanel className="p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-white">Edit profile</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="mb-1 block text-xs text-muted">
                  Display name
                </label>
                <input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  maxLength={50}
                  placeholder={user?.username}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="bio" className="mb-1 block text-xs text-muted">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  maxLength={300}
                  placeholder="Tell other players a bit about yourself…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
                />
                <p className="mt-1 text-right text-[10px] text-muted">{form.bio.length}/300</p>
              </div>

              <div>
                <label htmlFor="country" className="mb-1 block text-xs text-muted">
                  Country
                </label>
                <input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  maxLength={60}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </GlassPanel>

          {/* Recent posts */}
          <GlassPanel className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white">Your recent posts</h3>
              <Link href="/community" className="text-xs text-primary hover:underline">
                View feed
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                You haven&apos;t posted yet.{" "}
                <Link href="/community" className="text-primary hover:underline">
                  Share something
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-white/5 p-3">
                    <p className="line-clamp-2 text-sm text-white/90">{post.content}</p>
                    <p className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                      <span>{timeAgo(post.createdAt)}</span>
                      <span>{post._count.likes} likes</span>
                      <span>{post._count.comments} comments</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
