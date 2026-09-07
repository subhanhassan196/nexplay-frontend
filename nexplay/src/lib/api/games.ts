import { api } from "@/lib/api/axios";

export interface GameSessionDTO {
  id: string;
  userId: string;
  gameId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  result: "WIN" | "LOSS" | "DRAW" | null;
  score: number;
  durationSeconds: number;
  startedAt: string;
  endedAt: string | null;
}

export interface GameStatsDTO {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  highScore: number;
  totalScore: number;
  totalPlaytimeSeconds: number;
  lastPlayedAt: string | null;
}

export interface LeaderboardEntryDTO {
  rank: number;
  username: string;
  score: string;
  updatedAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type GameResult = "WIN" | "LOSS" | "DRAW";

export const gamesApi = {
  startSession: (gameSlug: string, metadata?: Record<string, unknown>) =>
    api.post<ApiEnvelope<{ session: GameSessionDTO }>>(`/games/${gameSlug}/sessions`, { metadata }),

  endSession: (
    gameSlug: string,
    sessionId: string,
    payload: { result?: GameResult; score: number; durationSeconds: number; metadata?: Record<string, unknown> }
  ) =>
    api.patch<ApiEnvelope<{ session: GameSessionDTO; stats: GameStatsDTO; xpAwarded: number; isNewHighScore: boolean }>>(
      `/games/${gameSlug}/sessions/${sessionId}`,
      payload
    ),

  abandonSession: (gameSlug: string, sessionId: string) =>
    api.post<ApiEnvelope<{ session: GameSessionDTO }>>(`/games/${gameSlug}/sessions/${sessionId}/abandon`),

  myStats: (gameSlug: string) => api.get<ApiEnvelope<{ stats: GameStatsDTO | null }>>(`/games/${gameSlug}/stats/me`),

  leaderboard: (gameSlug: string, limit = 20) =>
    api.get<ApiEnvelope<{ entries: LeaderboardEntryDTO[] }>>(`/games/${gameSlug}/leaderboard`, { params: { limit } }),
};
