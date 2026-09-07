"use client";

/**
 * Lightweight sound-effect engine using the Web Audio API's oscillator
 * nodes — no external .mp3/.wav assets to host or lazy-load. Good
 * enough for crisp UI-feedback tones (move, win, lose, click); a real
 * music/ambient track would still want <audio> + Cloudinary-hosted
 * files, which this class's music toggle is ready to grow into.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private musicEnabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    return this.ctx;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
  }

  /** Plays a short tone. `type` selects a preset frequency/duration/waveform pairing. */
  play(type: "move" | "select" | "win" | "lose" | "draw" | "error" | "point" | "levelup") {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const presets: Record<typeof type, { freq: number; duration: number; wave: OscillatorType; glide?: number }> = {
      move: { freq: 420, duration: 0.08, wave: "sine" },
      select: { freq: 600, duration: 0.06, wave: "triangle" },
      win: { freq: 660, duration: 0.35, wave: "sine", glide: 880 },
      lose: { freq: 220, duration: 0.4, wave: "sawtooth", glide: 110 },
      draw: { freq: 340, duration: 0.25, wave: "square" },
      error: { freq: 160, duration: 0.15, wave: "square" },
      point: { freq: 520, duration: 0.07, wave: "sine" },
      levelup: { freq: 500, duration: 0.3, wave: "sine", glide: 1000 },
    };

    const { freq, duration, wave, glide } = presets[type];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }
}

export const audioManager = new AudioManager();
