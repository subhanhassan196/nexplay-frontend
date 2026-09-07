export const SITE_CONFIG = {
  name: "NexPlay",
  tagline: "Play • Compete • Earn",
  description:
    "NexPlay is a premium gaming platform where players compete in tournaments, climb global leaderboards, and earn real rewards.",
  url: "https://nexplay.gg",
} as const;

export type NavLink = {
  label: string;
  href: string;
};

export const MAIN_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Games", href: "/games" },
  { label: "Categories", href: "/categories" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Rewards", href: "/rewards" },
  { label: "Community", href: "/community" },
];

export const FOOTER_LINKS: { title: string; links: NavLink[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Games", href: "/games" },
      { label: "Categories", href: "/categories" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Leaderboards", href: "/leaderboards" },
      { label: "Rewards", href: "/rewards" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://twitter.com/nexplay" },
  { label: "Discord", href: "https://discord.gg/nexplay" },
  { label: "YouTube", href: "https://youtube.com/@nexplay" },
  { label: "Instagram", href: "https://instagram.com/nexplay" },
] as const;

export const BREAKPOINTS = {
  xs: 420,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
