"use client";

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

const STORAGE_KEY = "nexplay:game-settings";

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
};

/**
 * Persists cross-game preferences (sound/music toggles) to
 * localStorage so they survive a page refresh and apply consistently
 * across every game, not per-game. Deliberately NOT stored server-side
 * — this is a client-device preference, not account data.
 */
export const settingsManager = {
  load(): GameSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  save(settings: GameSettings) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },
};
