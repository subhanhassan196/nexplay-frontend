"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, ImagePlus, Mic, Square, X, Loader2, Play, Pause, Trash2 } from "lucide-react";
import { useVoiceRecorder, formatDuration } from "@/hooks/useVoiceRecorder";
import type { UploadedAttachment } from "@/lib/api/messenger";
import { cn } from "@/lib/utils";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_MB = 8;
const MAX_FILE_MB = 15;

interface AgentComposerProps {
  onSend: (content: string, attachments?: UploadedAttachment[]) => Promise<void>;
  onUploadFile: (file: File, durationSeconds?: number) => Promise<UploadedAttachment>;
  onTyping?: (typing: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Composer for the agent side of the inbox.
 *
 * Agents get the same tools as customers — photo, document and voice —
 * because a support answer is often clearer as a screenshot or a spoken
 * explanation than as a paragraph of text.
 *
 * Uploads happen on send rather than on pick, so abandoning a draft never
 * leaves an orphaned file in storage.
 */
export function AgentComposer({ onSend, onUploadFile, onTyping, disabled, placeholder }: AgentComposerProps) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const voice = useVoiceRecorder();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.previewUrl);
    };
  }, [image]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file) return;

    setError(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG or WebP images can be sent.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Images must be under ${MAX_IMAGE_MB}MB.`);
      return;
    }
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  function pickDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (docInputRef.current) docInputRef.current.value = "";
    if (!file) return;

    setError(null);
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Files must be under ${MAX_FILE_MB}MB.`);
      return;
    }
    setDoc(file);
  }

  function clearImage() {
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
  }

  const hasAttachment = Boolean(image || doc || voice.blob);
  const canSend = (value.trim().length > 0 || hasAttachment) && !disabled && !isSending;

  async function submit() {
    if (!canSend) return;
    setIsSending(true);
    setError(null);

    try {
      let attachments: UploadedAttachment[] | undefined;
      let fallback = "";

      if (hasAttachment) {
        const uploaded: UploadedAttachment[] = [];
        if (image) uploaded.push(await onUploadFile(image.file));
        if (doc) uploaded.push(await onUploadFile(doc));
        if (voice.blob) {
          const file = new File([voice.blob], `voice-note.${voice.blob.type.includes("ogg") ? "ogg" : "webm"}`, {
            type: voice.blob.type,
          });
          uploaded.push(await onUploadFile(file, voice.duration));
        }
        attachments = uploaded;

        const first = uploaded[0];
        fallback =
          first?.kind === "VOICE" ? "🎤 Voice message" : first?.kind === "DOCUMENT" ? `📎 ${first.filename}` : "📷 Photo";
      }

      await onSend(value.trim() || fallback || "📎 Attachment", attachments);

      setValue("");
      clearImage();
      setDoc(null);
      voice.reset();
      onTyping?.(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setError("Couldn't send. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-t border-white/10">
      {/* Queued image */}
      {image && (
        <div className="px-3 pt-3">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.previewUrl} alt="Attachment preview" className="h-20 w-20 rounded-xl border border-white/10 object-cover" />
            <button
              onClick={clearImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-background text-muted hover:text-danger"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Queued document */}
      {doc && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
            <Paperclip className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-xs text-white">{doc.name}</span>
            <button onClick={() => setDoc(null)} aria-label="Remove file">
              <X className="h-3.5 w-3.5 text-muted hover:text-danger" />
            </button>
          </div>
        </div>
      )}

      {/* Voice: recording or preview */}
      {(voice.state === "recording" || voice.state === "recorded") && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-2.5">
            {voice.state === "recording" ? (
              <>
                <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
                <span className="flex-1 text-xs text-white">Recording… {formatDuration(voice.duration)}</span>
                <button
                  onClick={voice.stop}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white"
                  aria-label="Stop recording"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <audio ref={voiceAudioRef} src={voice.previewUrl ?? undefined} onEnded={() => setVoicePlaying(false)} className="hidden" />
                <button
                  onClick={() => {
                    const audio = voiceAudioRef.current;
                    if (!audio) return;
                    if (voicePlaying) {
                      audio.pause();
                      setVoicePlaying(false);
                    } else {
                      void audio.play();
                      setVoicePlaying(true);
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white"
                  aria-label={voicePlaying ? "Pause preview" : "Play preview"}
                >
                  {voicePlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
                </button>
                <span className="flex-1 text-xs text-white">Voice note · {formatDuration(voice.duration)}</span>
                <button onClick={voice.reset} aria-label="Discard recording">
                  <Trash2 className="h-4 w-4 text-muted hover:text-danger" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {voice.state === "denied" && (
        <p role="alert" className="px-4 pt-2 text-xs text-danger">
          Microphone access was blocked. Enable it in your browser settings to record voice notes.
        </p>
      )}

      {error && (
        <p role="alert" className="px-4 pt-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex items-end gap-1.5 p-3">
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || isSending || voice.state === "recording"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-white disabled:opacity-50"
          aria-label="Attach an image"
          title="Attach an image"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} className="hidden" tabIndex={-1} />

        <button
          onClick={() => docInputRef.current?.click()}
          disabled={disabled || isSending || voice.state === "recording"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-white disabled:opacity-50"
          aria-label="Attach a file"
          title="Attach a file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf"
          onChange={pickDoc}
          className="hidden"
          tabIndex={-1}
        />

        {voice.isSupported && (
          <button
            onClick={voice.state === "recording" ? voice.stop : voice.start}
            disabled={disabled || isSending}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
              voice.state === "recording" ? "bg-danger/20 text-danger" : "text-muted hover:text-white"
            )}
            aria-label={voice.state === "recording" ? "Stop recording" : "Record a voice message"}
            title={voice.state === "recording" ? "Stop recording" : "Record a voice message"}
          >
            {voice.state === "recording" ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping?.(e.target.value.length > 0);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          onBlur={() => onTyping?.(false)}
          placeholder={placeholder ?? "Type your reply…"}
          rows={1}
          disabled={disabled}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />

        <button
          onClick={submit}
          disabled={!canSend}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
            canSend ? "bg-nexplay-gradient text-white hover:opacity-90" : "bg-white/5 text-muted"
          )}
          aria-label="Send reply"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
