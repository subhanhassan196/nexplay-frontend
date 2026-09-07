import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Account Locked",
  robots: { index: false, follow: false },
};

export default function AccountLockedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-32">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold text-white">Account Temporarily Locked</h1>
        <p className="text-sm text-muted">
          We detected too many failed login attempts on this account and locked it to keep it safe. It will
          unlock automatically after the cooldown period, or you can reset your password now to regain access
          immediately.
        </p>
        <div className="flex w-full flex-col gap-3 pt-2">
          <Button href="/forgot-password" size="lg" fullWidth>
            Reset Password
          </Button>
          <Button href="/login" variant="outline" size="lg" fullWidth>
            Back to Login
          </Button>
        </div>
        <p className="pt-2 text-xs text-muted">
          Think this was a mistake?{" "}
          <a href="/contact" className="text-primary hover:text-primary-hover">
            Contact support
          </a>
        </p>
      </GlassPanel>
    </div>
  );
}
