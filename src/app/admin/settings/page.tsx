"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { adminSupportApi } from "@/lib/api/adminSupport";
import { useToast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminSupportApi.getSettings();
        setSettings(data.data.settings);
      } catch {
        setSettings({});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function save(key: string, value: string) {
    setSavingKey(key);
    try {
      await adminSupportApi.updateSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      toast({ variant: "success", title: "Saved" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isOnline = settings.is_online === "true";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Support Settings</h1>
        <p className="text-sm text-muted">Control what users see in the messenger.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        {/* Online status */}
        <div className="rounded-2xl border border-white/10 bg-surface/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Support Status</p>
              <p className="text-sm text-muted">Show as online or offline in the messenger.</p>
            </div>
            <button
              onClick={() => save("is_online", isOnline ? "false" : "true")}
              disabled={savingKey === "is_online"}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                isOnline ? "bg-success" : "bg-white/10"
              )}
              aria-label="Toggle online status"
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                  isOnline ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Welcome message */}
        <SettingField
          label="Welcome Message"
          description="First thing users see when they open the messenger."
          value={settings.welcome_message || ""}
          multiline
          onSave={(v) => save("welcome_message", v)}
          saving={savingKey === "welcome_message"}
        />

        {/* Support hours */}
        <SettingField
          label="Support Hours"
          description="Displayed next to your online status (e.g. 24/7, Mon–Fri 9–5)."
          value={settings.support_hours || ""}
          onSave={(v) => save("support_hours", v)}
          saving={savingKey === "support_hours"}
        />

        {/* Offline message */}
        <SettingField
          label="Offline Message"
          description="Shown when support status is offline."
          value={settings.offline_message || ""}
          multiline
          onSave={(v) => save("offline_message", v)}
          saving={savingKey === "offline_message"}
        />
      </div>
    </div>
  );
}

function SettingField({
  label,
  description,
  value,
  multiline,
  onSave,
  saving,
}: {
  label: string;
  description: string;
  value: string;
  multiline?: boolean;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const dirty = draft !== value;

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/40 p-5">
      <p className="font-medium text-white">{label}</p>
      <p className="mb-3 text-sm text-muted">{description}</p>
      {multiline ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
        />
      ) : (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
        />
      )}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onSave(draft)}
          disabled={!dirty || saving}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            dirty && !saving ? "bg-nexplay-gradient text-white" : "bg-white/5 text-muted"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
