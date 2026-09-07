import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Statistics } from "@/components/home/Statistics";
import { ShieldCheck, Rocket, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "NexPlay's mission is to build the fairest, most rewarding competitive gaming platform in the world.",
};

const values = [
  { icon: ShieldCheck, title: "Integrity First", desc: "Every ranked match is built on verified, fair competition." },
  { icon: Rocket, title: "Built for Scale", desc: "Engineered from day one to support millions of concurrent players." },
  { icon: Users, title: "Player-Owned Community", desc: "Tournaments, rewards, and features shaped by real player feedback." },
];

export default function AboutPage() {
  return (
    <div className="pt-32">
      <div className="container-nexplay section-padding">
        <SectionHeading
          eyebrow="Our Mission"
          title="Building the Future of"
          highlight="Competitive Gaming"
          description="NexPlay was founded on a simple idea: competitive gaming should be fair, rewarding, and genuinely fun to be part of — for casual players and pros alike."
          className="max-w-3xl"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, desc }) => (
            <GlassPanel key={title} hoverGlow className="flex flex-col gap-4 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexplay-gradient/20 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
            </GlassPanel>
          ))}
        </div>
      </div>
      <Statistics />
    </div>
  );
}
