"use client";

import { useEffect, useState } from "react";
import { Users, Gamepad2, Trophy, MessagesSquare } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "@/lib/api/axios";
import { formatCompactNumber } from "@/lib/utils";

interface PlatformStats {
  players: number;
  games: number;
  tournaments: number;
  messages: number;
}

/**
 * Live platform counters. These are real COUNT queries — the figures
 * here always match what the games page, tournaments page and admin
 * panel report.
 */
export function Statistics() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: PlatformStats }>("/games/stats")
      .then(({ data }) => {
        if (!cancelled) setStats(data.data);
      })
      .catch(() => setStats(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { label: "Registered Players", value: stats?.players, icon: Users },
    { label: "Games Available", value: stats?.games, icon: Gamepad2 },
    { label: "Tournaments Held", value: stats?.tournaments, icon: Trophy },
    { label: "Messages Exchanged", value: stats?.messages, icon: MessagesSquare },
  ];

  return (
    <section className="section-padding">
      <div className="container-nexplay">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-surface/40 p-6 text-center"
            >
              <item.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
              <p className="font-display text-3xl font-bold text-white">
                {item.value === undefined ? (
                  <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" />
                ) : (
                  formatCompactNumber(item.value)
                )}
              </p>
              <p className="mt-1 text-xs text-muted">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
