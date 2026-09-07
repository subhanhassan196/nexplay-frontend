"use client";

import { useState, type FormEvent } from "react";
import { Mail, MessageSquare, MapPin, Send } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const contactInfo = [
  { icon: Mail, label: "Email", value: "support@nexplay.gg" },
  { icon: MessageSquare, label: "Discord", value: "discord.gg/nexplay" },
  { icon: MapPin, label: "Headquarters", value: "Remote-first, worldwide" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2: POST to /api/contact
    setSubmitted(true);
  }

  return (
    <div className="container-nexplay section-padding pt-32">
      <SectionHeading
        eyebrow="Get In Touch"
        title="Contact"
        highlight="Us"
        description="Questions, partnership inquiries, or press requests — we'd love to hear from you."
        className="mb-12"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-4">
          {contactInfo.map(({ icon: Icon, label, value }) => (
            <GlassPanel key={label} className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nexplay-gradient/20 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
                <p className="text-sm font-medium text-white">{value}</p>
              </div>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="p-6 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                <Send className="h-6 w-6" />
              </span>
              <h3 className="font-display text-lg font-semibold text-white">Message Sent</h3>
              <p className="max-w-sm text-sm text-muted">
                Thanks for reaching out — our team will respond within 24-48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Full Name" name="name" placeholder="Your name" required />
                <Input label="Email" name="email" type="email" placeholder="you@email.com" required />
              </div>
              <Input label="Subject" name="subject" placeholder="How can we help?" required />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-muted">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Tell us more..."
                  className="w-full rounded-xl border border-white/10 bg-surface-light px-4 py-3 text-sm text-white placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button type="submit" size="lg" icon={<Send className="h-4 w-4" />}>
                Send Message
              </Button>
            </form>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
