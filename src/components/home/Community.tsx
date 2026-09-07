import { MessageCircle, Twitter, Youtube } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";

const channels = [
  { icon: MessageCircle, title: "Discord", desc: "Join 500K+ players discussing strategy, teams, and tournaments.", href: "https://discord.gg/nexplay", cta: "Join Discord" },
  { icon: Twitter, title: "Twitter / X", desc: "Live tournament updates, patch notes, and community highlights.", href: "https://twitter.com/nexplay", cta: "Follow Us" },
  { icon: Youtube, title: "YouTube", desc: "Match replays, highlight reels, and creator spotlights.", href: "https://youtube.com/@nexplay", cta: "Subscribe" },
];

export function Community() {
  return (
    <section className="section-padding">
      <div className="container-nexplay flex flex-col gap-10">
        <SectionHeading
          eyebrow="Connect"
          title="Join the"
          highlight="Community"
          align="center"
          className="mx-auto"
        />

        <div className="grid gap-5 sm:grid-cols-3">
          {channels.map(({ icon: Icon, title, desc, href, cta }) => (
            <GlassPanel key={title} hoverGlow className="flex flex-col items-center gap-4 p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nexplay-gradient/20 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
              <Button href={href} variant="outline" size="sm">
                {cta}
              </Button>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
