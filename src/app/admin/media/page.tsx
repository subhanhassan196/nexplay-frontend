"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Search, Trash2, FolderOpen, Copy, Check, Image as ImageIcon } from "lucide-react";
import { mediaApi, type MediaAssetDTO } from "@/lib/api/cms";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

export default function AdminMediaPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<MediaAssetDTO[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await mediaApi.list({
        limit: 50,
        folder: activeFolder || undefined,
        search: search || undefined,
      });
      setAssets(data.data.items);
      setFolders(data.data.folders);
    } catch {
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await mediaApi.upload(file, activeFolder || "general");
      await load();
      toast({ variant: "success", title: "Uploaded" });
    } catch (err) {
      toast({ variant: "error", title: "Upload failed", description: getApiErrorMessage(err) });
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    try {
      await mediaApi.remove(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast({ variant: "success", title: "Deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  function copyUrl(asset: MediaAssetDTO) {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Media Library</h1>
          <p className="text-sm text-muted">Upload and manage images used across the site.</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {isUploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {/* Search + folders */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFolder("")}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
              !activeFolder ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
            )}
          >
            <FolderOpen className="h-3 w-3" /> All
          </button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFolder(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                activeFolder === f ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-surface/40 p-12 text-center">
          <ImageIcon className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted">No media yet. Upload your first image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.altText || a.filename} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => copyUrl(a)}
                    className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
                    aria-label="Copy URL"
                  >
                    {copiedId === a.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-danger/70"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="truncate text-[10px] text-white">{a.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
