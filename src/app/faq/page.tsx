import type { Metadata } from "next";
import { FAQSection } from "@/components/home/FAQSection";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about NexPlay.",
};

export default function FaqPage() {
  return (
    <div className="pt-24">
      <FAQSection />
    </div>
  );
}
