import { Medal, Flame, Crown, Target } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

const achievements = [
  { icon: Crown, title: "Season Champion", desc: "Finish #1 on any seasonal leaderboard.", tier: "text-accent" },
  { icon: Flame, title: "Win Streak x10", desc: "Win 10 ranked matches in a row.", tier: "text-danger" },
  { icon: Target, title: "Sharpshooter", desc: "Achieve a 90%+ accuracy rating in a match.", tier: "text-secondary" },
  { icon: Medal, title: "Tournament Veteran", desc: "Compete in 25 official tournaments.", tier: "text-primary" },
];

export function Achievements() {
  return (
    <section className="section-padding bg-surface/30">
      <div className="container-nexplay flex flex-col gap-10">
        <SectionHeading
          eyebrow="Progression"
          title="Unlock"
          highlight="Achievements"
          description="Show off your skill with badges earned across every game on the platform."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map(({ icon: Icon, title, desc, tier }) => (
            <GlassPanel key={title} hoverGlow className="flex flex-col items-center gap-3 p-6 text-center">
              <span className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ${tier}`}>
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-muted">{desc}</p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
