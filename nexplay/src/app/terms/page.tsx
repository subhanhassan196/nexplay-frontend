import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "NexPlay Terms of Service.",
};

const sections = [
  { title: "1. Acceptance of Terms", body: "By creating a NexPlay account or using any part of the platform, you agree to be bound by these Terms of Service and our Privacy Policy." },
  { title: "2. Eligibility", body: "You must be at least 13 years old to use NexPlay. Certain tournaments with cash prizes may require additional age or regional verification." },
  { title: "3. Account Responsibility", body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account." },
  { title: "4. Fair Play & Conduct", body: "Cheating, exploiting bugs, harassment, or use of unauthorized third-party software to gain a competitive advantage will result in suspension or permanent ban." },
  { title: "5. Rewards & Virtual Currency", body: "NexPlay Coins and other virtual items have no cash value outside the platform and are non-transferable except through official platform features." },
  { title: "6. Tournament Rules", body: "Each tournament may carry additional rules published on its detail page. Participation constitutes agreement to those rules in addition to these Terms." },
  { title: "7. Termination", body: "NexPlay reserves the right to suspend or terminate accounts that violate these Terms, community guidelines, or applicable law." },
  { title: "8. Changes to These Terms", body: "We may update these Terms from time to time. Continued use of NexPlay after changes take effect constitutes acceptance of the revised Terms." },
];

export default function TermsPage() {
  return (
    <div className="container-nexplay section-padding pt-32">
      <SectionHeading
        eyebrow="Legal"
        title="Terms of"
        highlight="Service"
        description="Last updated: July 2026. Please read these terms carefully before using NexPlay."
        className="mb-10 max-w-2xl"
      />
      <GlassPanel className="flex flex-col gap-8 p-6 sm:p-10">
        {sections.map((s) => (
          <div key={s.title} className="flex flex-col gap-2">
            <h2 className="font-display text-lg font-semibold text-white">{s.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}
