"use client";

import { useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2: POST to /api/newsletter
    setSubmitted(true);
  }

  return (
    <section className="section-padding">
      <div className="container-nexplay">
        <GlassPanel className="relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div className="absolute inset-0 bg-nexplay-radial opacity-70" />
          <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexplay-gradient shadow-glow-primary">
              <Mail className="h-5 w-5 text-white" />
            </span>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Never Miss a Tournament
            </h2>
            <p className="text-sm text-muted">
              Get weekly drops on new games, tournament schedules, and exclusive rewards.
            </p>

            {submitted ? (
              <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
                You&apos;re on the list! Check your inbox to confirm.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sm:flex-1"
                />
                <Button type="submit" icon={<Send className="h-4 w-4" />}>
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
