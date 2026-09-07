"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cmsApi, type FaqDTO } from "@/lib/api/cms";
import { cn } from "@/lib/utils";

/**
 * FAQ accordion driven by the CMS — questions are added and edited from
 * the admin panel, so this section never needs a code change.
 */
export function FAQSection() {
  const [faqs, setFaqs] = useState<FaqDTO[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    cmsApi
      .listFaq(true)
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.data.faqs.slice(0, 6);
        setFaqs(list);
        setOpenId(list[0]?.id ?? null);
      })
      .catch(() => setFaqs([]))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && faqs.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-nexplay flex flex-col gap-10">
        <SectionHeading
          eyebrow="Questions"
          title="Frequently"
          highlight="Asked"
          description="Everything you need to know about competing on NexPlay."
        />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <GlassPanel key={faq.id} className="overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-white">{faq.question}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
