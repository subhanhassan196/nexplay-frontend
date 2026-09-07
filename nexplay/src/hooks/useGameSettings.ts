"use client";

import { useCallback, useEffect, useState } from "react";
import { settingsManager, type GameSettings } from "@/lib/gameEngine/SettingsManager";
import { audioManager } from "@/lib/gameEngine/AudioManager";

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(() => settingsManager.load());

  useEffect(() => {
    audioManager.setSoundEnabled(settings.soundEnabled);
    audioManager.setMusicEnabled(settings.musicEnabled);
  }, [settings.soundEnabled, settings.musicEnabled]);

  const toggleSound = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      settingsManager.save(next);
      audioManager.setSoundEnabled(next.soundEnabled);
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, musicEnabled: !prev.musicEnabled };
      settingsManager.save(next);
      audioManager.setMusicEnabled(next.musicEnabled);
      return next;
    });
  }, []);

  return { settings, toggleSound, toggleMusic };
}
