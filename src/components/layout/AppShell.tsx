"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MessengerLauncher } from "@/components/messenger/MessengerLauncher";
import { MessengerPanel } from "@/components/messenger/MessengerPanel";

/**
 * Decides which chrome wraps the page.
 *
 * The admin console has its own sidebar, header and inbox, so rendering
 * the public navbar and floating support launcher on top of it made two
 * headers stack and put a chat bubble over the agent's reply box. Admin
 * routes therefore render bare — the console supplies its own layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <MessengerLauncher />
      <MessengerPanel />
    </>
  );
}
