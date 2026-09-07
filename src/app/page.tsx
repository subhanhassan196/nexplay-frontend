import dynamic from "next/dynamic";
import { Hero } from "@/components/home/Hero";
import { LivePlayersCounter } from "@/components/home/LivePlayersCounter";
import { TrendingGames } from "@/components/home/TrendingGames";

/**
 * Everything above the fold ships in the initial bundle; the rest is
 * split out and loaded as the visitor scrolls. That keeps the first
 * paint light without changing how the page looks or behaves.
 *
 * Each placeholder reserves roughly the height of its section so nothing
 * jumps as the chunks arrive.
 */
const skeleton = (height: string) => () => <div className={`${height} w-full`} aria-hidden="true" />;

const Categories = dynamic(() => import("@/components/home/Categories").then((m) => m.Categories), {
  loading: skeleton("h-80"),
});
const FeaturedGames = dynamic(() => import("@/components/home/FeaturedGames").then((m) => m.FeaturedGames), {
  loading: skeleton("h-96"),
});
const WhyNexPlay = dynamic(() => import("@/components/home/WhyNexPlay").then((m) => m.WhyNexPlay), {
  loading: skeleton("h-80"),
});
const LeaderboardPreview = dynamic(
  () => import("@/components/home/LeaderboardPreview").then((m) => m.LeaderboardPreview),
  { loading: skeleton("h-96") }
);
const Achievements = dynamic(() => import("@/components/home/Achievements").then((m) => m.Achievements), {
  loading: skeleton("h-80"),
});
const Statistics = dynamic(() => import("@/components/home/Statistics").then((m) => m.Statistics), {
  loading: skeleton("h-48"),
});
const Community = dynamic(() => import("@/components/home/Community").then((m) => m.Community), {
  loading: skeleton("h-80"),
});
const FAQSection = dynamic(() => import("@/components/home/FAQSection").then((m) => m.FAQSection), {
  loading: skeleton("h-96"),
});
const Newsletter = dynamic(() => import("@/components/home/Newsletter").then((m) => m.Newsletter), {
  loading: skeleton("h-64"),
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <LivePlayersCounter />
      <TrendingGames />
      <Categories />
      <FeaturedGames />
      <WhyNexPlay />
      <LeaderboardPreview />
      <Achievements />
      <Statistics />
      <Community />
      <FAQSection />
      <Newsletter />
    </>
  );
}
