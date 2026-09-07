"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, Link2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

/**
 * Image field for admin forms.
 *
 * Replaces the raw "paste a URL" input: an admin adding a game shouldn't
 * have to host the artwork somewhere first. Uploading stores the file
 * and writes the resulting URL back into the same field, so everything
 * downstream (the DB column, the public site) is unchanged.
 *
 * Pasting a URL still works — some images legitimately live elsewhere —
 * so the manual input is kept behind a toggle rather than removed.
 */
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Groups uploads in storage, e.g. "games". */
  folder?: string;
  hint?: string;
}

export function ImageUploadField({ label, value, onChange, folder = "general", hint }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setError(null);

    // Checked here so the user finds out immediately rather than after
    // waiting for an upload the server will reject.
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 8MB.");
      return;
    }

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);

      const { data } = await api.post<{ data: { asset: { url: string } } }>("/admin/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.data.asset.url);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs text-muted">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-white"
        >
          <Link2 className="h-3 w-3" />
          {showUrlInput ? "Upload instead" : "Paste URL"}
        </button>
      </div>

      {showUrlInput ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /games/example.jpg"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
      ) : (
        <div className="flex items-center gap-3">
          {/* Preview — also confirms the stored URL actually resolves. */}
          <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            {value ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white transition-colors hover:bg-danger"
                  aria-label={`Remove ${label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <ImageIcon className="h-5 w-5 text-muted" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-xs transition-colors",
                isUploading ? "text-muted" : "text-white hover:border-primary/50 hover:bg-white/[0.03]"
              )}
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {isUploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </button>
            {hint && !error && <p className="mt-1 truncate text-[10px] text-muted">{hint}</p>}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
