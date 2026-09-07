"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const password = watch("password") ?? "";

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    try {
      await authApi.resetPassword({ ...values, token });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertCircle className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">Invalid Reset Link</h1>
        <p className="text-sm text-muted">This password reset link is missing its token. Please request a new one.</p>
        <Button href="/forgot-password" size="md">
          Request New Link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">Password Reset</h1>
        <p className="text-sm text-muted">Your password has been updated. Redirecting you to log in...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexplay-gradient shadow-glow-primary">
          <ShieldCheck className="h-6 w-6 text-white" />
        </span>
        <h1 className="font-display text-2xl font-bold text-white">Reset Your Password</h1>
        <p className="text-sm text-muted">Choose a new, strong password for your account.</p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <PasswordInput
            label="New Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <PasswordInput
          label="Confirm New Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
          Back to Login
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 w-full max-w-md p-8">
        <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </GlassPanel>
    </div>
  );
}
