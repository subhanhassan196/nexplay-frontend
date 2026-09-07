"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User, Gamepad2, AlertCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password") ?? "";

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await authApi.register(values);
      router.push(`/email-sent?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexplay-gradient shadow-glow-primary">
            <Gamepad2 className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-sm text-muted">Join millions of players competing on NexPlay.</p>
        </div>

        {serverError && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Username"
            placeholder="YourGamerTag"
            icon={<User className="h-4 w-4" />}
            error={errors.username?.message}
            {...register("username")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="flex flex-col gap-2">
            <PasswordInput
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrengthMeter password={password} />
          </div>
          <PasswordInput
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <label className="flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-surface-light accent-primary"
              {...register("agreeToTerms")}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:text-primary-hover">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:text-primary-hover">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && <p className="text-xs text-danger">{errors.agreeToTerms.message}</p>}

          <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Log in
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}
