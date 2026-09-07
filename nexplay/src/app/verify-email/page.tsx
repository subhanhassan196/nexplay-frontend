"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, MailCheck } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(getApiErrorMessage(err));
      });
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <XCircle className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">Verification Failed</h1>
        <p className="text-sm text-muted">This verification link is missing its token.</p>
        <Button href="/login" variant="outline" size="md">
          Back to Login
        </Button>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Loader2 className="h-7 w-7 animate-spin" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">Verifying Your Email</h1>
        <p className="text-sm text-muted">Hang tight, this only takes a moment.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">Email Verified</h1>
        <p className="text-sm text-muted">Your account is now fully active. You can log in and start competing.</p>
        <Button href="/login" size="md">
          Continue to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <XCircle className="h-7 w-7" />
      </span>
      <h1 className="font-display text-xl font-bold text-white">Verification Failed</h1>
      <p className="text-sm text-muted">{message}</p>
      <Button href="/login" variant="outline" size="md">
        Back to Login
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 w-full max-w-md p-8">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MailCheck className="h-7 w-7" />
              </span>
              <p className="text-sm text-muted">Loading...</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </GlassPanel>
    </div>
  );
}
