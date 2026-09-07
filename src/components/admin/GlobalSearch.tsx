"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, User, Ticket, MessageSquare, Gamepad2, Megaphone, Loader2, X } from "lucide-react";
import { searchApi, type SearchResults } from "@/lib/api/search";
import { cn } from "@/lib/utils";

const EMPTY: SearchResults = { users: [], tickets: [], messages: [], games: [], announcements: [] };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await searchApi.global(query.trim());
        setResults(data.data);
      } catch {
        setResults(EMPTY);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const totalResults =
    results.users.length +
    results.tickets.length +
    results.messages.length +
    results.games.length +
    results.announcements.length;

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users, tickets, messages, games…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-9 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(EMPTY);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : totalResults === 0 ? (
              <div className="py-8 text-center text-sm text-muted">No results for &ldquo;{query}&rdquo;</div>
            ) : (
              <div className="p-2">
                <SearchGroup title="Users" icon={User}>
                  {results.users.map((u) => (
                    <div key={u.id} className="search-item">
                      <span className="font-medium text-white">{u.username}</span>
                      <span className="text-xs text-muted">{u.email}</span>
                    </div>
                  ))}
                </SearchGroup>

                <SearchGroup title="Tickets" icon={Ticket}>
                  {results.tickets.map((t) => (
                    <Link key={t.id} href="/admin/conversations" className="search-item block" onClick={() => setIsOpen(false)}>
                      <span className="font-medium text-white">#{t.ticketNumber}</span>
                      <span className="text-xs text-muted">
                        {t.user.username} · {t.state.toLowerCase()} · {t.priority.toLowerCase()}
                      </span>
                    </Link>
                  ))}
                </SearchGroup>

                <SearchGroup title="Messages" icon={MessageSquare}>
                  {results.messages.map((m) => (
                    <Link
                      key={m.id}
                      href="/admin/conversations"
                      className="search-item block"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="line-clamp-1 text-white">{m.content}</span>
                      <span className="text-xs text-muted">{m.senderType.toLowerCase()}</span>
                    </Link>
                  ))}
                </SearchGroup>

                <SearchGroup title="Games" icon={Gamepad2}>
                  {results.games.map((g) => (
                    <Link key={g.id} href={`/games/${g.slug}`} className="search-item block" onClick={() => setIsOpen(false)}>
                      <span className="font-medium text-white">{g.title}</span>
                    </Link>
                  ))}
                </SearchGroup>

                <SearchGroup title="Announcements" icon={Megaphone}>
                  {results.announcements.map((a) => (
                    <Link
                      key={a.id}
                      href="/admin/announcements"
                      className="search-item block"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="font-medium text-white">{a.title}</span>
                    </Link>
                  ))}
                </SearchGroup>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchGroup({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode[] }) {
  if (!children || children.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      {children}
    </div>
  );
}
