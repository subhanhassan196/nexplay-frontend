import { api } from "@/lib/api/axios";

// ── Rewards ──
export interface WheelSegmentDTO {
  id: string;
  label: string;
  color: string;
  rewardType: "COINS" | "BADGE" | "FRAME" | "NAMEPLATE" | "NOTHING";
  coinAmount: number;
  order: number;
}

export interface SpinStatusDTO {
  canSpin: boolean;
  lastSpin: { segmentId: string; coinsWon: number; at: string } | null;
  resetsAt: string;
}

export interface SpinResultDTO {
  segment: { id: string; label: string; rewardType: string; coinAmount: number };
  coinsWon: number;
  balance: number;
}

export interface DailyRewardConfigDTO {
  id: string;
  dayNumber: number;
  label: string;
  rewardType: string;
  coinAmount: number;
}

export interface DailyStatusDTO {
  canClaim: boolean;
  currentStreak: number;
  nextDayNumber: number;
  claimedToday: boolean;
  config: DailyRewardConfigDTO[];
}

export interface StoreItemDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  rarity: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  price: number;
  stock: number | null;
  order: number;
}

// ── Leaderboard ──
export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  gamesPlayed: number;
  wins: number;
}

// ── Tournaments ──
export interface TournamentDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  rules?: string | null;
  bannerUrl: string | null;
  status: "DRAFT" | "UPCOMING" | "REGISTRATION_OPEN" | "LIVE" | "COMPLETED" | "CANCELLED";
  format: string;
  maxParticipants: number;
  prizePoolCents: number;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  startsAt: string;
  endsAt: string | null;
  game: { id: string; slug: string; title: string; coverImageUrl: string | null } | null;
  _count?: { participants: number };
  participants?: {
    id: string;
    status: string;
    joinedAt: string;
    user: { id: string; username: string; profile: { avatarUrl: string | null } | null };
  }[];
  results?: { placement: number; prizeCents: number; user: { id: string; username: string } }[];
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const rewardsApi = {
  balance: () => api.get<Envelope<{ balance: number }>>("/rewards/balance"),
  wheelSegments: () => api.get<Envelope<{ segments: WheelSegmentDTO[] }>>("/rewards/wheel"),
  spinStatus: () => api.get<Envelope<SpinStatusDTO>>("/rewards/wheel/status"),
  spin: () => api.post<Envelope<SpinResultDTO>>("/rewards/wheel/spin"),
  dailyStatus: () => api.get<Envelope<DailyStatusDTO>>("/rewards/daily"),
  claimDaily: () => api.post<Envelope<{ dayNumber: number; label: string; coinsWon: number; balance: number }>>("/rewards/daily/claim"),
  storeItems: () => api.get<Envelope<{ items: StoreItemDTO[] }>>("/rewards/store"),
  redeem: (id: string) => api.post<Envelope<{ balance: number }>>(`/rewards/store/${id}/redeem`),
};

export const leaderboardApi = {
  global: (gameId?: string) => api.get<Envelope<{ entries: LeaderboardEntryDTO[] }>>("/leaderboard", { params: { gameId } }),
  weekly: () => api.get<Envelope<{ entries: LeaderboardEntryDTO[] }>>("/leaderboard/weekly"),
  friends: () => api.get<Envelope<{ entries: LeaderboardEntryDTO[] }>>("/leaderboard/friends"),
};

export const tournamentApi = {
  list: (params?: { status?: string; game?: string }) =>
    api.get<Envelope<{ tournaments: TournamentDTO[] }>>("/tournaments", { params }),
  getBySlug: (slug: string) => api.get<Envelope<{ tournament: TournamentDTO }>>(`/tournaments/${slug}`),
  register: (slug: string) => api.post<Envelope<object>>(`/tournaments/${slug}/register`),
};

export const adminTournamentApi = {
  list: () => api.get<Envelope<{ tournaments: TournamentDTO[] }>>("/admin/tournaments"),
  create: (data: Partial<TournamentDTO> & { gameId: string }) =>
    api.post<Envelope<{ tournament: TournamentDTO }>>("/admin/tournaments", data),
  update: (id: string, data: Partial<TournamentDTO>) =>
    api.patch<Envelope<{ tournament: TournamentDTO }>>(`/admin/tournaments/${id}`, data),
  remove: (id: string) => api.delete<Envelope<object>>(`/admin/tournaments/${id}`),
};
