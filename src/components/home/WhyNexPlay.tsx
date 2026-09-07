import { ShieldCheck, Zap, Trophy, Wallet } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

const features = [
  {
    icon: ShieldCheck,
    title: "Fair & Secure",
    description: "Every match is protected by verified matchmaking and competitive integrity systems.",
    color: "text-success",
  },
  {
    icon: Zap,
    title: "Instant Matchmaking",
    description: "Low-latency infrastructure gets you into a match in seconds, not minutes.",
    color: "text-secondary",
  },
  {
    icon: Trophy,
    title: "Real Competition",
    description: "Ranked seasons, live tournaments, and global leaderboards that actually matter.",
    color: "text-accent",
  },
  {
    icon: Wallet,
    title: "Real Rewards",
    description: "Turn your in-game performance into coins, gear, and exclusive prizes.",
    color: "text-primary",
  },
];

export function WhyNexPlay() {
  return (
    <section className="section-padding bg-surface/30">
      <div className="container-nexplay flex flex-col gap-10">
        <SectionHeading
          eyebrow="The Platform"
          title="Why Players Choose"
          highlight="NexPlay"
          align="center"
          className="mx-auto"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, color }) => (
            <GlassPanel key={title} hoverGlow className="flex flex-col gap-4 p-6">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${color}`}>
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-muted">{description}</p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
