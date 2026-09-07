"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, RotateCw } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";

function EmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.resendVerification(email);
      setResent(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nexplay-gradient shadow-glow-primary">
        <MailCheck className="h-7 w-7 text-white" />
      </span>
      <h1 className="font-display text-xl font-bold text-white">Check Your Inbox</h1>
      <p className="text-sm text-muted">
        We&apos;ve sent a verification link to{" "}
        {email ? <span className="font-medium text-white">{email}</span> : "your email address"}. Click it to
        activate your NexPlay account.
      </p>

      {error && <p className="text-xs text-danger">{error}</p>}
      {resent && !error && <p className="text-xs text-success">Verification email resent.</p>}

      <Button
        onClick={handleResend}
        variant="outline"
        size="md"
        disabled={loading || !email}
        icon={<RotateCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />}
        iconPosition="left"
      >
        {loading ? "Resending..." : "Resend Email"}
      </Button>

      <Button href="/login" variant="ghost" size="sm">
        Back to Login
      </Button>
    </div>
  );
}

export default function EmailSentPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 w-full max-w-md p-8">
        <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Loading...</div>}>
          <EmailSentContent />
        </Suspense>
      </GlassPanel>
    </div>
  );
}
