import { Gamepad2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="flex h-14 w-14 animate-pulse-glow items-center justify-center rounded-2xl bg-nexplay-gradient shadow-glow-primary">
        <Gamepad2 className="h-7 w-7 text-white" />
      </span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
