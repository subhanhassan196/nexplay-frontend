"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Headset, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useAuth } from "@/context/AuthContext";
import { useMessenger } from "@/context/MessengerContext";
import { api, getApiErrorMessage } from "@/lib/api/axios";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * An agent's personal support link.
 *
 * A customer arriving here is connected straight to that agent's queue
 * instead of the general pool. Claiming requires being signed in — the
 * link identifies an agent, it doesn't authenticate anyone — so guests
 * are sent to log in and returned here afterwards.
 */
export default function AgentSupportLinkPage({ params }: PageProps) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { open } = useMessenger();
  const router = useRouter();

  const [state, setState] = useState<"connecting" | "connected" | "error">("connecting");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(async () => {
    try {
      const { data } = await api.post<{ data: { agent: { username: string } } }>(`/messenger/agent-link/${slug}`);
      setAgentName(data.data.agent.username);
      setState("connected");
      // Open the messenger so the conversation is right there.
      setTimeout(open, 600);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setState("error");
    }
  }, [slug, open]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(`/support/${slug}`)}`);
      return;
    }
    claim();
  }, [authLoading, isAuthenticated, claim, router, slug]);

  return (
    <div className="container-nexplay flex min-h-[70vh] items-center justify-center pt-32">
      <GlassPanel className="w-full max-w-md p-8 text-center">
        {state === "connecting" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <h1 className="font-display text-xl font-bold text-white">Connecting you to support…</h1>
            <p className="mt-2 text-sm text-muted">Just a moment.</p>
          </>
        )}

        {state === "connected" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-success" />
            <h1 className="font-display text-xl font-bold text-white">
              You&apos;re connected{agentName ? ` to ${agentName}` : ""}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Your support chat is open — send a message and they&apos;ll pick it up.
            </p>
            <button
              onClick={open}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-nexplay-gradient py-3 font-medium text-white hover:opacity-90"
            >
              <Headset className="h-4 w-4" /> Open chat
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-danger" />
            <h1 className="font-display text-xl font-bold text-white">This link isn&apos;t available</h1>
            <p className="mt-2 text-sm text-muted">{error ?? "The support link may have expired."}</p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-xl border border-white/10 px-5 py-2.5 text-sm text-muted hover:text-white"
            >
              Back to NexPlay
            </Link>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
