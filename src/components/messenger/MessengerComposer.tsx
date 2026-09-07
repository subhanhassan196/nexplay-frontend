"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, Smile, Reply, Pencil, ImagePlus, Loader2, Paperclip, Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { useVoiceRecorder, formatDuration } from "@/hooks/useVoiceRecorder";
import type { UploadedAttachment } from "@/lib/api/messenger";
import { EmojiPicker } from "@/components/messenger/EmojiPicker";
import { type MessageDTO } from "@/lib/api/messenger";
import { cn } from "@/lib/utils";

const MAX_ATTACHMENT_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface MessengerComposerProps {
  onSend: (content: string, attachmentUrls?: string[], attachments?: UploadedAttachment[]) => void;
  onUploadAttachment?: (file: File) => Promise<string>;
  /** Uploads any chat file and returns its metadata. */
  onUploadFile?: (file: File, durationSeconds?: number) => Promise<UploadedAttachment>;
  onEditSubmit: (messageId: string, content: string) => void;
  replyTo: MessageDTO | null;
  editing: MessageDTO | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onTyping?: (typing: boolean) => void;
  disabled?: boolean;
}

export function MessengerComposer({
  onSend,
  onUploadAttachment,
  onUploadFile,
  onEditSubmit,
  replyTo,
  editing,
  onCancelReply,
  onCancelEdit,
  onTyping,
  disabled,
}: MessengerComposerProps) {
  const [value, setValue] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pending, setPending] = useState<{ file: File; previewUrl: string } | null>(null);
  // A non-image attachment queued for send (document). Kept separate from
  // `pending` because it has no visual preview.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const voice = useVoiceRecorder();
  const [voicePlaying, setVoicePlaying] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Release the object URL when the preview is replaced or cleared.
  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;

    setUploadError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Only JPEG, PNG or WebP images can be sent.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setUploadError(`Image must be under ${MAX_ATTACHMENT_MB}MB.`);
      return;
    }
    setPending({ file, previewUrl: URL.createObjectURL(file) });
  }

  function pickDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (docInputRef.current) docInputRef.current.value = "";
    if (!file) return;

    setUploadError(null);
    // 15MB matches the server-side document limit, so the user finds out
    // here rather than after a long upload that gets rejected.
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Files must be under 15MB.");
      return;
    }
    setPendingFile(file);
  }

  function clearPending() {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setUploadError(null);
  }

  // When entering edit mode, prefill with existing content.
  useEffect(() => {
    if (editing) {
      setValue(editing.content);
      textareaRef.current?.focus();
    }
  }, [editing]);

  async function submit() {
    const trimmed = value.trim();
    // An image on its own is a valid message; text alone is too.
    if ((!trimmed && !pending && !pendingFile && !voice.blob) || disabled || isUploading) return;

    if (editing) {
      if (!trimmed) return;
      onEditSubmit(editing.id, trimmed);
      onTyping?.(false);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }

    // Upload whatever is queued, then send once with the metadata. If an
    // upload fails we stop here so the user doesn't get a message that's
    // missing its attachment.
    let attachments: UploadedAttachment[] | undefined;
    let attachmentUrls: string[] | undefined;
    let fallbackText = "";

    const hasUpload = pending || pendingFile || voice.blob;
    if (hasUpload) {
      setIsUploading(true);
      setUploadError(null);
      try {
        if (onUploadFile) {
          const uploaded: UploadedAttachment[] = [];

          if (pending) uploaded.push(await onUploadFile(pending.file));
          if (pendingFile) uploaded.push(await onUploadFile(pendingFile));
          if (voice.blob) {
            const file = new File([voice.blob], `voice-note.${voice.blob.type.includes("ogg") ? "ogg" : "webm"}`, {
              type: voice.blob.type,
            });
            uploaded.push(await onUploadFile(file, voice.duration));
          }

          attachments = uploaded;
          // A sensible label when the message is attachment-only.
          const first = uploaded[0];
          fallbackText =
            first?.kind === "VOICE" ? "🎤 Voice message" : first?.kind === "DOCUMENT" ? `📎 ${first.filename}` : "📷 Photo";
        } else if (pending && onUploadAttachment) {
          // Older path, kept so the composer still works if only the
          // legacy image uploader is wired up.
          attachmentUrls = [await onUploadAttachment(pending.file)];
          fallbackText = "📷 Photo";
        }
      } catch {
        setUploadError("Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSend(trimmed || fallbackText || "📎 Attachment", attachmentUrls, attachments);
    onTyping?.(false);
    setValue("");
    clearPending();
    setPendingFile(null);
    voice.reset();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      if (editing) onCancelEdit();
      if (replyTo) onCancelReply();
    }
  }

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  return (
    <div className="border-t border-white/10 bg-background/70 backdrop-blur-sm">
      {/* Reply / edit context bar */}
      <AnimatePresence>
        {(replyTo || editing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 overflow-hidden border-b border-white/5 px-3 py-2"
          >
            {editing ? <Pencil className="h-3.5 w-3.5 text-primary" /> : <Reply className="h-3.5 w-3.5 text-primary" />}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-primary">{editing ? "Editing message" : "Replying to"}</p>
              <p className="truncate text-xs text-muted">{(editing ?? replyTo)?.content}</p>
            </div>
            <button
              onClick={editing ? onCancelEdit : onCancelReply}
              className="text-muted hover:text-white"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending image preview — removable before sending */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-3 pt-3"
          >
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.previewUrl}
                alt="Attachment preview"
                className="h-20 w-20 rounded-xl border border-white/10 object-cover"
              />
              <button
                onClick={clearPending}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-background text-muted hover:text-danger"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {isUploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queued document */}
      {pendingFile && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
            <Paperclip className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-xs text-white">{pendingFile.name}</span>
            <button onClick={() => setPendingFile(null)} aria-label="Remove file">
              <X className="h-3.5 w-3.5 text-muted hover:text-danger" />
            </button>
          </div>
        </div>
      )}

      {/* Voice: live recording, or a preview you can play before sending */}
      {(voice.state === "recording" || voice.state === "recorded") && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-2.5">
            {voice.state === "recording" ? (
              <>
                <span className="flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
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
                <audio
                  ref={voiceAudioRef}
                  src={voice.previewUrl ?? undefined}
                  onEnded={() => setVoicePlaying(false)}
                  className="hidden"
                />
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

      {uploadError && (
        <p role="alert" className="px-4 pt-2 text-xs text-danger">
          {uploadError}
        </p>
      )}

      <div className="relative flex items-end gap-0.5 p-2 sm:gap-1.5 sm:p-3">
        <div className="relative shrink-0">
          <button
            onClick={() => setEmojiOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-white sm:h-10 sm:w-10"
            aria-label="Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {emojiOpen && (
              <div className="absolute bottom-full left-0 mb-2 z-30">
                <EmojiPicker
                  onSelect={(emoji) => {
                    setValue((v) => v + emoji);
                    setEmojiOpen(false);
                    textareaRef.current?.focus();
                  }}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {!editing && onUploadAttachment && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={disabled || isUploading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-white disabled:opacity-50 sm:h-10 sm:w-10"
              aria-label="Attach image"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pickFile}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          </>
        )}

        {!editing && onUploadFile && (
          <>
            {/* Document attach — hidden on the smallest phones so the
                message field keeps real typing room; still on desktop. */}
            <button
              onClick={() => docInputRef.current?.click()}
              disabled={disabled || isUploading || voice.state === "recording"}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-white disabled:opacity-50 xs:flex sm:h-10 sm:w-10"
              aria-label="Attach a file"
              title="Attach a file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf"
              onChange={pickDocument}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />

            {voice.isSupported && (
              <button
                onClick={voice.state === "recording" ? voice.stop : voice.start}
                disabled={disabled || isUploading}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50 sm:h-10 sm:w-10",
                  voice.state === "recording" ? "bg-danger/20 text-danger" : "text-muted hover:text-white"
                )}
                aria-label={voice.state === "recording" ? "Stop recording" : "Record a voice message"}
                title={voice.state === "recording" ? "Stop recording" : "Record a voice message"}
              >
                {voice.state === "recording" ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
              </button>
            )}
          </>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!editing) onTyping?.(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onInput={autoGrow}
          disabled={disabled}
          rows={1}
          placeholder="Type a message…"
          aria-label="Message"
          className="max-h-[140px] min-h-[44px] w-full min-w-0 flex-1 resize-none overflow-y-auto break-words rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[15px] leading-snug text-white placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
          style={{ overflowWrap: "anywhere" }}
        />

        <button
          onClick={submit}
          disabled={disabled || isUploading || (!value.trim() && !pending && !pendingFile && !voice.blob)}
          aria-label="Send"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all sm:h-10 sm:w-10",
            (value.trim() || pending || pendingFile || voice.blob) && !disabled
              ? "bg-nexplay-gradient text-white hover:opacity-90"
              : "bg-white/5 text-muted"
          )}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
