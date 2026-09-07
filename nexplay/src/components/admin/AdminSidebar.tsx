"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessagesSquare, Megaphone, Link2, Settings, LayoutDashboard, ArrowLeft, Activity, BarChart3, FileText, Image, Globe, HeartPulse, Gamepad2, Gauge, Users, Trophy, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sidebar is grouped so the panel stays readable as sections are added —
 * operators scan by area (support, catalog, content) rather than one
 * long flat list.
 */
const navGroups: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/control-center", label: "Control Center", icon: Gauge },
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/activity", label: "Activity", icon: Activity },
    ],
  },
  {
    label: "Support",
    items: [{ href: "/admin/conversations", label: "Conversations", icon: MessagesSquare }],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/games", label: "Game Catalog", icon: Gamepad2 },
      { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
      { href: "/admin/rewards", label: "Rewards", icon: Gift },
      { href: "/admin/users", label: "Users & Access", icon: Users },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Pages & FAQ", icon: FileText },
      { href: "/admin/media", label: "Media", icon: Image },
      { href: "/admin/seo", label: "SEO", icon: Globe },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/quick-links", label: "Quick Links", icon: Link2 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/health", label: "System Health", icon: HeartPulse },
      { href: "/admin/settings", label: "Support Settings", icon: Settings },
    ],
  },
];

const navItems = navGroups.flatMap((g) => g.items);

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-16 flex-col border-r border-white/10 bg-surface/40 py-4 backdrop-blur-xl lg:w-60">
      <div className="mb-6 flex items-center gap-2 px-3 lg:px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-nexplay-gradient">
          <span className="font-display text-sm font-bold text-white">N</span>
        </div>
        <div className="hidden lg:block">
          <p className="font-display text-sm font-bold text-white">NexPlay</p>
          <p className="text-[10px] text-muted">Admin Console</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 lg:px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="hidden px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted/60 lg:block">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive ? "text-white" : "text-muted hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-xl bg-nexplay-gradient/15 ring-1 ring-primary/30"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4.5 w-4.5 shrink-0" />
                  <span className="relative hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-2 lg:px-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0" />
          <span className="hidden lg:block">Back to App</span>
        </Link>
      </div>
    </aside>
  );
}
