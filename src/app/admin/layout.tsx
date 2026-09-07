"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const ADMIN_ROLES = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />

      {/* Scrim behind the mobile drawer */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-[84] bg-black/60 md:hidden"
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-background/80 px-3 py-3 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-white md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <GlobalSearch />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
