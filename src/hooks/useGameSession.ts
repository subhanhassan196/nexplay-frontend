"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gamesApi, type GameResult } from "@/lib/api/games";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";

interface UseGameSessionOptions {
  gameSlug: string;
  /** Called once a completed session round-trips and stats/XP come back. */
  onRecorded?: (result: { isNewHighScore: boolean; xpAwarded: number }) => void;
}

/**
 * Owns the full session lifecycle every game in the engine shares:
 * start a session when play begins, track elapsed seconds, and submit
 * the final result/score on game-over. Works for logged-out visitors
 * too — session calls are simply skipped, so anyone can still play,
 * they just don't get XP/leaderboard/stats persistence (mirrors how
 * the rest of NexPlay treats guest vs. authenticated access).
 */
export function useGameSession({ gameSlug, onRecorded }: UseGameSessionOptions) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    async (metadata?: Record<string, unknown>) => {
      setElapsedSeconds(0);
      setIsActive(true);
      clearTimer();
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

      if (!isAuthenticated) {
        setSessionId(null);
        sessionIdRef.current = null;
        return;
      }

      try {
        const { data } = await gamesApi.startSession(gameSlug, metadata);
        setSessionId(data.data.session.id);
        sessionIdRef.current = data.data.session.id;
      } catch {
        // Session tracking is best-effort — the game is still playable locally.
        setSessionId(null);
        sessionIdRef.current = null;
      }
    },
    [gameSlug, isAuthenticated, clearTimer]
  );

  const pauseTimer = useCallback(() => {
    clearTimer();
    setIsActive(false);
  }, [clearTimer]);

  const resumeTimer = useCallback(() => {
    if (timerRef.current) return;
    setIsActive(true);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }, []);

  const endSession = useCallback(
    async (result: { result?: GameResult; score: number; metadata?: Record<string, unknown> }) => {
      clearTimer();
      setIsActive(false);

      if (!sessionIdRef.current) return;

      try {
        const { data } = await gamesApi.endSession(gameSlug, sessionIdRef.current, {
          ...result,
          durationSeconds: elapsedSeconds,
        });
        const { isNewHighScore, xpAwarded } = data.data;

        if (isNewHighScore) {
          toast({ variant: "success", title: "New High Score!", description: `+${xpAwarded} XP earned` });
        } else if (xpAwarded > 0) {
          toast({ variant: "info", title: `+${xpAwarded} XP`, description: "Progress saved." });
        }

        onRecorded?.({ isNewHighScore, xpAwarded });
      } catch (err) {
        toast({ variant: "error", title: "Couldn't save this session", description: getApiErrorMessage(err) });
      } finally {
        setSessionId(null);
        sessionIdRef.current = null;
      }
    },
    [gameSlug, elapsedSeconds, clearTimer, toast, onRecorded]
  );

  // Best-effort: if the player navigates away mid-game, mark the session abandoned.
  useEffect(() => {
    return () => {
      clearTimer();
      if (sessionIdRef.current) {
        gamesApi.abandonSession(gameSlug, sessionIdRef.current).catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSlug]);

  return { sessionId, elapsedSeconds, isActive, startSession, endSession, pauseTimer, resumeTimer };
}
