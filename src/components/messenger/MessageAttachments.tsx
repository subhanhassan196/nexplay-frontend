"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Download, Play, Pause, Mic } from "lucide-react";
import { formatDuration } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

export interface AttachmentDTO {
  id: string;
  kind: "IMAGE" | "DOCUMENT" | "VOICE";
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  width?: number | null;
  height?: number | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  attachments: AttachmentDTO[];
  /** Bubbles on the sender's side get lighter contrast treatment. */
  isMine?: boolean;
  onImageClick?: (url: string) => void;
}

/**
 * Renders whatever a message carries — a photo, a file, or a voice note.
 *
 * Each kind gets its own affordance rather than one generic "download"
 * link: an image previews inline, a document shows its name and size so
 * you know what you're opening, and a voice note gets a real player.
 */
export function MessageAttachments({ attachments, isMine, onImageClick }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="mb-1.5 flex flex-col gap-1.5">
      {attachments.map((a) => {
        if (a.kind === "IMAGE") {
          return (
            <button
              key={a.id}
              onClick={() => onImageClick?.(a.url)}
              className="block overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label={`Open ${a.filename}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.filename}
                loading="lazy"
                className="max-h-64 w-full max-w-[260px] object-cover transition-transform hover:scale-[1.02]"
              />
            </button>
          );
        }

        if (a.kind === "VOICE") {
          return <VoicePlayer key={a.id} attachment={a} isMine={isMine} />;
        }

        return (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
              isMine ? "border-white/20 bg-white/10 hover:bg-white/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <FileText className="h-4 w-4 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white">{a.filename}</span>
              <span className="block text-[10px] text-muted">{formatSize(a.sizeBytes)}</span>
            </span>
            <Download className="h-4 w-4 shrink-0 text-muted" />
          </a>
        );
      })}
    </div>
  );
}

function VoicePlayer({ attachment, isMine }: { attachment: AttachmentDTO; isMine?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const total = attachment.durationSeconds ?? 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      setElapsed(Math.floor(audio.currentTime));
      if (audio.duration && Number.isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setElapsed(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2.5",
        isMine ? "border-white/20 bg-white/10" : "border-white/10 bg-white/[0.04]"
      )}
    >
      <audio ref={audioRef} src={attachment.url} preload="metadata" />

      <button
        onClick={toggle}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <Mic className="h-3 w-3 text-muted" />
          <span className="text-[10px] text-muted">Voice message</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <span className="shrink-0 text-[10px] tabular-nums text-muted">
        {formatDuration(playing || elapsed > 0 ? elapsed : total)}
      </span>
    </div>
  );
}
