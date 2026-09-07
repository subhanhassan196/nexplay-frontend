"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Megaphone, Eye, EyeOff } from "lucide-react";
import { adminSupportApi, type AdminAnnouncementDTO } from "@/lib/api/adminSupport";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<AdminAnnouncementDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const { data } = await adminSupportApi.listAnnouncements();
      setAnnouncements(data.data.announcements);
    } catch {
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await adminSupportApi.createAnnouncement({ title: title.trim(), body: body.trim() });
      setTitle("");
      setBody("");
      setShowForm(false);
      await load();
      toast({ variant: "success", title: "Announcement published" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: AdminAnnouncementDTO) {
    try {
      await adminSupportApi.updateAnnouncement(a.id, { isActive: !a.isActive });
      setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: !x.isActive } : x)));
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  async function remove(id: string) {
    try {
      await adminSupportApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((x) => x.id !== id));
      toast({ variant: "success", title: "Deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Announcements</h1>
          <p className="text-sm text-muted">Broadcast messages shown in the support messenger.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-surface/40 p-5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Announcement body"
            rows={3}
            className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm text-muted hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim() || !body.trim()}
              className="rounded-xl bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />)
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-surface/40 p-12 text-center">
            <Megaphone className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">No announcements yet.</p>
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-2xl border p-4",
                a.isActive ? "border-white/10 bg-surface/40" : "border-white/5 bg-surface/20 opacity-60"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted">{a.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => toggleActive(a)} className="admin-action-btn" aria-label="Toggle active">
                  {a.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(a.id)} className="admin-action-btn hover:text-danger" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
