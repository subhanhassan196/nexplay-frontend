"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 w-full max-w-md p-8">
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="font-display text-xl font-bold text-white">Check Your Email</h1>
            <p className="text-sm text-muted">
              If an account exists with that email, we&apos;ve sent a password reset link. It expires in 30 minutes.
            </p>
            <Button href="/login" variant="outline" size="md" icon={<ArrowLeft className="h-4 w-4" />} iconPosition="left">
              Back to Login
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexplay-gradient shadow-glow-primary">
                <KeyRound className="h-6 w-6 text-white" />
              </span>
              <h1 className="font-display text-2xl font-bold text-white">Forgot Password?</h1>
              <p className="text-sm text-muted">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {serverError && (
              <div className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="you@email.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Remembered your password?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
                Log in
              </Link>
            </p>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
