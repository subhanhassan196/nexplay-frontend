"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice note recording.
 *
 * Wraps MediaRecorder with the bits a chat composer actually needs: a
 * live duration counter, a preview blob you can play before sending, and
 * a hard cap so a forgotten recording can't run indefinitely.
 *
 * The microphone stream is stopped on every exit path — stopping the
 * recorder alone leaves the browser's "recording" indicator on, which
 * looks like the site is still listening.
 */
const MAX_DURATION_SECONDS = 300;

export type RecorderState = "idle" | "recording" | "recorded" | "denied";

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    releaseStream();
  }, [releaseStream]);

  const start = useCallback(async () => {
    // Clear any previous take before starting a new one.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Browsers support different containers; let the browser pick one
      // it can actually encode rather than forcing a type it'll reject.
      const preferred = ["audio/webm", "audio/ogg", "audio/mp4"];
      const mimeType = preferred.find((t) => MediaRecorder.isTypeSupported(t));

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBlob(recorded);
        setPreviewUrl(URL.createObjectURL(recorded));
        setState("recorded");
      };

      recorder.start();
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const next = d + 1;
          // Stop rather than silently truncating on the server later.
          if (next >= MAX_DURATION_SECONDS) stop();
          return next;
        });
      }, 1000);
    } catch {
      // Permission refused, or no microphone on the device.
      setState("denied");
      releaseStream();
    }
  }, [previewUrl, stop, releaseStream]);

  const reset = useCallback(() => {
    stop();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    setState("idle");
  }, [stop, previewUrl]);

  // Never leave the microphone open if the component unmounts mid-record.
  useEffect(() => {
    return () => {
      releaseStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    duration,
    blob,
    previewUrl,
    isSupported: typeof window !== "undefined" && typeof MediaRecorder !== "undefined",
    start,
    stop,
    reset,
  };
}

/** mm:ss for the recording timer and player. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
