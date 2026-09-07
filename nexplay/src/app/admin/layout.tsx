"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const ADMIN_ROLES = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

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
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-white/10 bg-background/80 px-6 py-3 backdrop-blur-xl">
          <GlobalSearch />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
