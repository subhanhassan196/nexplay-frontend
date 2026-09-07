import { Home, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-nexplay-radial" />
      <GlassPanel className="relative z-10 flex max-w-md flex-col items-center gap-5 p-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-nexplay-gradient shadow-glow-primary">
          <Gamepad2 className="h-8 w-8 text-white" />
        </span>
        <h1 className="font-display text-6xl font-bold text-gradient">404</h1>
        <h2 className="font-display text-xl font-semibold text-white">Level Not Found</h2>
        <p className="text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Button href="/" icon={<Home className="h-4 w-4" />} iconPosition="left">
          Back to Home
        </Button>
      </GlassPanel>
    </div>
  );
}
