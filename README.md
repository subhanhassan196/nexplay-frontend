# NexPlay — Phase 1 Foundation

**Play • Compete • Earn**

This is the Phase 1 foundation of NexPlay: a production-grade Next.js (App Router) frontend
with a complete design system, reusable component library, and all core pages scaffolded
with real (mock-data-driven) UI — no backend, auth, database, or games logic included by design.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion (micro-interactions, scroll reveals)
- GSAP (installed, ready for advanced timeline animations in Phase 2)
- lucide-react (icon system)

## Getting Started

> **Important:** `node_modules` is NOT included in this package (keeps the ZIP small).
> If you open this project in an editor before running `npm install`, you will see
> red squiggly lines like `Cannot find module 'react'` — this is expected and not
> a real bug. It disappears immediately after `npm install` completes.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build (verified clean, 17 static routes)
- `npm run start` — run the production build
- `npm run lint` — ESLint

## Folder Structure

```
src/
  app/                    # Routes (App Router) — one folder per page
    games/ categories/ leaderboards/ tournaments/ rewards/
    about/ contact/ login/ register/ dashboard/ faq/ terms/ privacy/
    layout.tsx             # Root layout: fonts, metadata, Navbar/Footer shell
    page.tsx                # Home page (composes all home sections)
    globals.css              # Design tokens, base styles, Tailwind v4 entry
    not-found.tsx             # Custom 404
    loading.tsx                # Global route-level loading state
    error.tsx                   # Global error boundary
    robots.ts / sitemap.ts       # SEO
  components/
    ui/                     # Design-system primitives (Button, GlassPanel, Badge,
                             # SectionHeading, Skeleton, StatCounter, Input, StateScreens)
    layout/                  # Navbar, Footer
    home/                     # Home-page sections (Hero, TrendingGames, Categories, etc.)
    shared/                    # Domain components used across pages (GameCard,
                               # TournamentCard, RewardCard, LeaderboardTable)
  lib/
    utils.ts                  # cn() class merger + formatting helpers
    constants.ts                # Nav links, footer links, site config
  types/
    index.ts                    # Domain types (Game, Tournament, Reward, etc.)
  data/
    mock.ts                      # Mock data — replace with real API calls in Phase 2
```

## Design System

All tokens live in `tailwind.config.ts` (colors, shadows, gradients, animation
keyframes) and `src/app/globals.css` (`.glass`, `.glass-panel`, `.text-gradient`,
`.container-nexplay`, `.section-padding` utility classes).

| Token | Value |
|---|---|
| Background | `#09090B` |
| Surface | `#121212` |
| Primary | `#7C3AED` |
| Secondary | `#06B6D4` |
| Accent | `#F59E0B` |
| Success | `#22C55E` |
| Danger | `#EF4444` |

Typography: **Space Grotesk** (display/headings) + **Inter** (body), loaded via
`<link>` in the root layout so the build never depends on network access to
Google Fonts.

## What's Intentionally NOT Built (Phase 1 scope)

- No backend / API routes
- No authentication (Login/Register pages are UI-only forms)
- No database / Prisma / PostgreSQL
- No real game logic
- All data comes from `src/data/mock.ts`, shaped to match the types in
  `src/types/index.ts` so swapping in real API calls later requires no
  component changes — only replacing the data source.

## Phase 2 Additions (on top of Phase 1)

- `components/motion/` — `Magnetic`, `TiltCard`, `ScrollReveal`/`StaggerGroup`, `PageTransition`
- `app/template.tsx` — animates every route transition
- New UI primitives: `Modal`, `Tabs`, `Accordion`, `Tooltip`, `Toast` (+ `ToastProvider`), `Carousel`, `Avatar`, `Select`, `Sidebar`
- Navbar: mega menu, search bar, notifications icon, profile avatar
- `GameCard`: 3D tilt + wishlist toggle
- `/games`: search, sidebar filters, sort, grid/list view toggle
- `/games/[slug]`: full Game Details page with tabs and related games
- `/community`: forum-style feed page
- `/leaderboards`: tabbed scopes (Global / Weekly / Friends)
- `/rewards`: Daily Rewards streak, animated Bonus Wheel, XP progress bar
- Home: `LivePlayersCounter`, `FeaturedStreamers` sections; Hero particle field + magnetic CTAs

## Phase 3 Additions (Authentication)

- Connects to the `nexplay-server` backend (separate project/repo) via
  `NEXT_PUBLIC_API_URL` — see `.env.local.example`
- `AuthProvider` (`src/context/AuthContext.tsx`) — global auth state,
  hydrated from the httpOnly access-token cookie on load
- `src/lib/api/axios.ts` — axios instance with automatic silent
  refresh-token retry on 401
- `src/middleware.ts` — redirects unauthenticated users away from
  `/dashboard`, and authenticated users away from `/login`, `/register`, `/forgot-password`
- Real, validated forms (React Hook Form + Zod) on Login and Register,
  with a live password-strength meter and show/hide password toggle
- New pages: `/forgot-password`, `/reset-password`, `/verify-email`,
  `/email-sent`, `/account-locked`
- Navbar and Dashboard now reflect real logged-in state instead of mock data

## Next Steps (Phase 4+)

1. Auth (NextAuth or custom JWT) wired into `/login`, `/register`, `/dashboard`
2. PostgreSQL + Prisma schema for Users, Games, Tournaments, Leaderboards, Rewards
3. Real-time features via Socket.IO (live tournaments, live leaderboard updates)
4. Payments integration for real-money tournament prize pools
5. Admin panel
6. Actual game embeds/clients
