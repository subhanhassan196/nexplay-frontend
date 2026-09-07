import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "NexPlay Privacy Policy.",
};

const sections = [
  { title: "1. Information We Collect", body: "We collect information you provide directly (account details, profile info) and information generated through platform use (match history, rankings, device data)." },
  { title: "2. How We Use Information", body: "Your information is used to operate matchmaking, leaderboards, and tournaments, personalize your experience, and maintain platform security and fair play." },
  { title: "3. Data Sharing", body: "We do not sell personal data. Limited data may be shared with service providers strictly to operate core platform features (hosting, payments, anti-cheat)." },
  { title: "4. Cookies", body: "NexPlay uses cookies and similar technologies to keep you signed in, remember preferences, and understand platform usage patterns." },
  { title: "5. Data Security", body: "We apply industry-standard safeguards to protect your data, including encryption in transit and restricted internal access controls." },
  { title: "6. Your Rights", body: "Depending on your region, you may have the right to access, correct, export, or delete your personal data. Requests can be submitted via our Contact page." },
  { title: "7. Children's Privacy", body: "NexPlay is not directed at children under 13, and we do not knowingly collect personal information from children under that age." },
  { title: "8. Policy Updates", body: "We may revise this Privacy Policy periodically. Material changes will be communicated through the platform before taking effect." },
];

export default function PrivacyPage() {
  return (
    <div className="container-nexplay section-padding pt-32">
      <SectionHeading
        eyebrow="Legal"
        title="Privacy"
        highlight="Policy"
        description="Last updated: July 2026. This policy explains how NexPlay collects, uses, and protects your data."
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
