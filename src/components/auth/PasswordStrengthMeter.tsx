"use client";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/validators/auth";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-white/10 transition-colors duration-300",
              i < score && color
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
