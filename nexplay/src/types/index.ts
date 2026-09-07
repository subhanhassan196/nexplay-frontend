/**
 * Phase 1 domain types.
 * These describe the SHAPE of data the UI expects. In later phases,
 * these will be generated/validated from Prisma models + API responses,
 * so field names are chosen to match a realistic future schema.
 */

export type GameCategory =
  | "action"
  | "strategy"
  | "card"
  | "puzzle"
  | "sports"
  | "racing"
  | "battle-royale"
  | "casual";

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  coverImage: string;
  category: GameCategory;
  players: number;
  rating: number; // 0-5
  isTrending?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  avatar: string;
  score: number;
  country?: string;
  trend?: "up" | "down" | "same";
}

export interface Tournament {
  id: string;
  slug: string;
  title: string;
  game: string;
  prizePool: number;
  currency: "USD" | "COINS";
  startsAt: string; // ISO date
  participants: number;
  maxParticipants: number;
  status: "upcoming" | "live" | "completed";
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number; // in NexPlay coins
  image: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface Testimonial {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
}

export interface Streamer {
  id: string;
  name: string;
  handle: string;
  game: string;
  viewers: number;
  isLive: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatarSeed: string;
  content: string;
  game?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  rank: string;
  badges: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
