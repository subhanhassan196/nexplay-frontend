import Link from "next/link";
import { Swords, BrainCircuit, Layers, Puzzle, Trophy, Car, Crosshair, Gamepad } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

const categories = [
  { label: "Action", slug: "action", icon: Swords, count: 32 },
  { label: "Strategy", slug: "strategy", icon: BrainCircuit, count: 18 },
  { label: "Card", slug: "card", icon: Layers, count: 14 },
  { label: "Puzzle", slug: "puzzle", icon: Puzzle, count: 21 },
  { label: "Sports", slug: "sports", icon: Trophy, count: 12 },
  { label: "Racing", slug: "racing", icon: Car, count: 16 },
  { label: "Battle Royale", slug: "battle-royale", icon: Crosshair, count: 9 },
  { label: "Casual", slug: "casual", icon: Gamepad, count: 27 },
];

export function Categories() {
  return (
    <section className="section-padding bg-surface/30">
      <div className="container-nexplay flex flex-col gap-10">
        <SectionHeading
          eyebrow="Browse"
          title="Find Your"
          highlight="Category"
          description="Every genre, curated and ranked by NexPlay's live community activity."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(({ label, slug, icon: Icon, count }) => (
            <Link key={slug} href={`/categories?type=${slug}`}>
              <GlassPanel
                hoverGlow
                className="flex flex-col gap-3 p-5 transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nexplay-gradient/20 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-semibold text-white">{label}</h3>
                  <p className="text-xs text-muted">{count} games</p>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
