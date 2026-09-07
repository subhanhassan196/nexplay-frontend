"use client";

import { Trophy, Coins, Gamepad2, TrendingUp, LogOut, AlertTriangle, MessageCircle, Shield } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeaderboardRowSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const summary = [
  { icon: Trophy, label: "Tournaments Won", value: "0" },
  { icon: Coins, label: "Coin Balance", value: "0" },
  { icon: Gamepad2, label: "Games Played", value: "0" },
  { icon: TrendingUp, label: "Global Rank", value: "Unranked" },
];

/**
 * Phase 3 dashboard: real auth (username, verification status, logout)
 * wired in. Game stats, match history, and recommendations remain
 * mock/skeleton until the gameplay APIs ship in a later phase.
 */
export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="container-nexplay section-padding pt-32">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  return (
    <div className="container-nexplay section-padding pt-32">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <Badge variant="primary" className="w-fit">
            Player Dashboard
          </Badge>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Welcome back, {user?.username ?? "Player"}
          </h1>
          <p className="text-sm text-muted">Here&apos;s a snapshot of your NexPlay activity.</p>
        </div>
        <div className="flex items-center gap-2">
          {user && ["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(user.role) && (
            <Button href="/admin" variant="primary" size="sm" icon={<Shield className="h-4 w-4" />} iconPosition="left">
              Admin Panel
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<LogOut className="h-4 w-4" />} iconPosition="left" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>

      {user && !user.isEmailVerified && (
        <GlassPanel className="mb-8 flex items-center gap-3 border-accent/30 bg-accent/5 px-5 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-accent" />
          <p className="text-sm text-white/90">
            Your email isn&apos;t verified yet. Check your inbox, or{" "}
            <a href="/email-sent" className="font-medium text-accent hover:underline">
              resend the verification link
            </a>
            .
          </p>
        </GlassPanel>
      )}

      <div className="mb-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {summary.map(({ icon: Icon, label, value }) => (
          <GlassPanel key={label} className="flex flex-col gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-nexplay-gradient/20 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </GlassPanel>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Need a hand?</h2>
          <GlassPanel className="flex flex-col items-start gap-3 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nexplay-gradient/20 text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-white">NexPlay Support is one tap away</p>
              <p className="mt-1 text-sm text-muted">
                Tap the chat button in the corner anytime for game access, setup help, rewards, tournaments, and
                more — your conversation is always saved here.
              </p>
            </div>
          </GlassPanel>
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Your Rank Progress</h2>
          <GlassPanel className="p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <LeaderboardRowSkeleton key={i} />
            ))}
          </GlassPanel>
          <p className="mt-3 text-xs text-muted">Ranked history connects once matchmaking goes live.</p>
        </div>
      </div>
    </div>
  );
}
