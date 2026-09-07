"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  Gamepad2,
  Swords,
  BrainCircuit,
  Trophy,
  Crosshair,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MAIN_NAV, SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

const megaMenuCategories = [
  { label: "Action", href: "/categories?type=action", icon: Swords, desc: "Combat, shooters, stealth" },
  { label: "Strategy", href: "/categories?type=strategy", icon: BrainCircuit, desc: "Empire building, tactics" },
  { label: "Sports", href: "/categories?type=sports", icon: Trophy, desc: "Competitive simulations" },
  { label: "Battle Royale", href: "/categories?type=battle-royale", icon: Crosshair, desc: "Last one standing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
    if (searchOpen) setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "py-2" : "py-4")}>
      <div className="container-nexplay">
        <div
          className={cn(
            "glass flex h-14 items-center justify-between rounded-2xl px-4 transition-shadow duration-300",
            scrolled && "shadow-glass"
          )}
        >
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <motion.span
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-nexplay-gradient shadow-glow-primary"
            >
              <Gamepad2 className="h-5 w-5 text-white" />
            </motion.span>
            {SITE_CONFIG.name}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {MAIN_NAV.map((item) => {
              const active = pathname === item.href;
              const isGames = item.href === "/games";
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => isGames && setMegaOpen(true)}
                  onMouseLeave={() => isGames && setMegaOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      active ? "text-white" : "text-muted hover:text-white"
                    )}
                  >
                    {item.label}
                    {isGames && <ChevronDown className="h-3.5 w-3.5" />}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-nexplay-gradient"
                      />
                    )}
                  </Link>

                  <AnimatePresence>
                    {isGames && megaOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="glass-panel absolute left-1/2 top-full mt-3 grid w-[480px] -translate-x-1/2 grid-cols-2 gap-2 p-4"
                      >
                        {megaMenuCategories.map(({ label, href, icon: Icon, desc }) => (
                          <Link
                            key={label}
                            href={href}
                            className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nexplay-gradient/20 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium text-white">{label}</span>
                              <span className="block text-xs text-muted">{desc}</span>
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((o) => !o)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-white",
                searchOpen && "bg-white/5 text-white"
              )}
            >
              <Search className="h-4 w-4" />
            </button>
            {isAuthenticated && <NotificationBell />}
            <Link href="/dashboard" aria-label="Dashboard" className="ml-1">
              <Avatar name={user?.username ?? "Guest"} size="sm" online={isAuthenticated} />
            </Link>
            {isAuthenticated ? (
              <Button href="/dashboard" variant="primary" size="sm">
                Dashboard
              </Button>
            ) : (
              <Button href="/register" variant="primary" size="sm">
                Get Started
              </Button>
            )}
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="glass mt-2 hidden overflow-hidden rounded-2xl lg:block"
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <Search className="h-4 w-4 text-muted" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search games, players, tournaments..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="glass mt-2 overflow-hidden rounded-2xl lg:hidden"
            >
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                <Search className="h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search NexPlay..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
                />
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {MAIN_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      pathname === item.href ? "bg-primary/10 text-white" : "text-muted hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-3">
                  {isAuthenticated ? (
                    <Button href="/dashboard" variant="primary" size="sm" fullWidth>
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button href="/login" variant="outline" size="sm" fullWidth>
                        Log In
                      </Button>
                      <Button href="/register" variant="primary" size="sm" fullWidth>
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
