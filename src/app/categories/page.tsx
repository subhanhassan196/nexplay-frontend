import type { Metadata } from "next";
import { Swords, BrainCircuit, Layers, Puzzle, Trophy, Car, Crosshair, Gamepad } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse NexPlay games by category — action, strategy, racing, card, puzzle, sports, and more.",
};

const categories = [
  { label: "Action", slug: "action", icon: Swords, count: 32, desc: "Fast-paced combat, shooters, and stealth games." },
  { label: "Strategy", slug: "strategy", icon: BrainCircuit, count: 18, desc: "Empire building, tactics, and real-time strategy." },
  { label: "Card", slug: "card", icon: Layers, count: 14, desc: "Competitive deck-builders and ranked card battlers." },
  { label: "Puzzle", slug: "puzzle", icon: Puzzle, count: 21, desc: "Physics-based and logic-driven speedrun puzzles." },
  { label: "Sports", slug: "sports", icon: Trophy, count: 12, desc: "Simulated leagues and competitive sports titles." },
  { label: "Racing", slug: "racing", icon: Car, count: 16, desc: "Street racing, anti-grav circuits, and open worlds." },
  { label: "Battle Royale", slug: "battle-royale", icon: Crosshair, count: 9, desc: "Last-player-standing arenas with live events." },
  { label: "Casual", slug: "casual", icon: Gamepad, count: 27, desc: "Quick-session games for every skill level." },
];

export default function CategoriesPage() {
  return (
    <div className="container-nexplay section-padding pt-28 sm:pt-32">
      <SectionHeading
        eyebrow="Browse"
        title="Game"
        highlight="Categories"
        description="Every genre on NexPlay, ranked by live community engagement."
        className="mb-10"
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ label, slug, icon: Icon, count, desc }) => (
          <GlassPanel key={slug} hoverGlow className="flex flex-col gap-4 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexplay-gradient/20 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-white">{label}</h3>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </div>
            <span className="mt-auto text-xs uppercase tracking-wide text-muted">
              {count} games available
            </span>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
