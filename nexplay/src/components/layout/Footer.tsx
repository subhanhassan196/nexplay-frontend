import Link from "next/link";
import type { ReactNode } from "react";
import { Gamepad2, Twitter, Youtube, Instagram, MessageCircle } from "lucide-react";
import { FOOTER_LINKS, SITE_CONFIG, SOCIAL_LINKS } from "@/lib/constants";

const socialIcon: Record<string, ReactNode> = {
  Twitter: <Twitter className="h-4 w-4" />,
  Discord: <MessageCircle className="h-4 w-4" />,
  YouTube: <Youtube className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
};

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface/40">
      <div className="container-nexplay grid grid-cols-2 gap-10 py-16 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-nexplay-gradient shadow-glow-primary">
              <Gamepad2 className="h-5 w-5 text-white" />
            </span>
            {SITE_CONFIG.name}
          </Link>
          <p className="max-w-xs text-sm text-muted">{SITE_CONFIG.description}</p>
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted transition-colors hover:border-primary/40 hover:text-primary"
              >
                {socialIcon[social.label]}
              </a>
            ))}
          </div>
        </div>

        {FOOTER_LINKS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-white">{column.title}</h4>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 py-6">
        <div className="container-nexplay flex flex-col items-center justify-between gap-3 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.</span>
          <span>Built for players who compete.</span>
        </div>
      </div>
    </footer>
  );
}
