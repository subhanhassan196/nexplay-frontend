"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Gamepad2, AlertCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/axios";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const { data } = await authApi.login(values);
      setUser(data.data.user);
      router.push(searchParams.get("redirect") ?? "/dashboard");
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message.toLowerCase().includes("locked")) {
        router.push("/account-locked");
        return;
      }
      setServerError(message);
    }
  }

  return (
    <>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexplay-gradient shadow-glow-primary">
            <Gamepad2 className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-muted">Log in to continue competing on NexPlay.</p>
        </div>

        {serverError && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
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
          <PasswordInput
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-white/20 bg-surface-light accent-primary"
                {...register("rememberMe")}
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-primary hover:text-primary-hover">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
            Sign up free
          </Link>
        </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 w-full max-w-md p-8">
        <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </GlassPanel>
    </div>
  );
}
