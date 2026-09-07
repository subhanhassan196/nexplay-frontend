"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2, X, Sparkles, Gift, Store, Coins } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  adminPlatformApi,
  type WheelSegmentAdminDTO,
  type DailyConfigDTO,
  type AdminStoreItemDTO,
} from "@/lib/api/adminPlatform";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

type Tab = "wheel" | "daily" | "store";
const REWARD_TYPES = ["COINS", "BADGE", "FRAME", "NAMEPLATE", "NOTHING"];
const RARITIES = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

/**
 * Rewards configuration. Everything the public rewards page shows is
 * edited here — wheel odds, the daily ladder and the store catalogue.
 * Wheel weights are relative: a segment with weight 20 is twice as
 * likely as one with weight 10.
 */
export default function AdminRewardsPage() {
  const [tab, setTab] = useState<Tab>("wheel");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Rewards Configuration</h1>
        <p className="text-sm text-muted">Wheel odds, daily login ladder and the reward store.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: "wheel", label: "Bonus Wheel", icon: Sparkles },
            { id: "daily", label: "Daily Rewards", icon: Gift },
            { id: "store", label: "Reward Store", icon: Store },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              tab === t.id ? "border-primary/50 bg-primary/15 text-white" : "border-white/10 text-muted hover:text-white"
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "wheel" && <WheelManager />}
      {tab === "daily" && <DailyManager />}
      {tab === "store" && <StoreManager />}
    </div>
  );
}

function WheelManager() {
  const { toast } = useToast();
  const [segments, setSegments] = useState<WheelSegmentAdminDTO[]>([]);
  const [editing, setEditing] = useState<Partial<WheelSegmentAdminDTO> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminPlatformApi.listSegments();
      setSegments(data.data.segments);
    } catch {
      setSegments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalWeight = segments.filter((s) => s.isActive).reduce((sum, s) => sum + s.weight, 0);

  async function save() {
    if (!editing?.label?.trim()) return;
    try {
      const payload = {
        label: editing.label.trim(),
        rewardType: editing.rewardType ?? "COINS",
        coinAmount: Number(editing.coinAmount ?? 0),
        color: editing.color ?? "#7C3AED",
        weight: Number(editing.weight ?? 10),
        order: Number(editing.order ?? segments.length + 1),
        isActive: editing.isActive ?? true,
      };
      if (editing.id) await adminPlatformApi.updateSegment(editing.id, payload);
      else await adminPlatformApi.createSegment(payload);
      setEditing(null);
      await load();
      toast({ variant: "success", title: "Segment saved" });
    } catch (err) {
      toast({ variant: "error", title: "Save failed", description: getApiErrorMessage(err) });
    }
  }

  async function remove(id: string) {
    try {
      await adminPlatformApi.deleteSegment(id);
      await load();
      toast({ variant: "success", title: "Segment removed" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditing({ label: "", weight: 10, coinAmount: 0, color: "#7C3AED", isActive: true })}
        className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Add Segment
      </button>

      {editing && (
        <GlassPanel className="border-primary/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">{editing.id ? "Edit segment" : "New segment"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Label</label>
              <input
                value={editing.label ?? ""}
                onChange={(e) => setEditing((s) => ({ ...s!, label: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Reward type</label>
              <select
                value={editing.rewardType ?? "COINS"}
                onChange={(e) => setEditing((s) => ({ ...s!, rewardType: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none"
              >
                {REWARD_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-surface">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Coin amount</label>
              <input
                type="number"
                value={editing.coinAmount ?? 0}
                onChange={(e) => setEditing((s) => ({ ...s!, coinAmount: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Weight (relative odds)</label>
              <input
                type="number"
                value={editing.weight ?? 10}
                onChange={(e) => setEditing((s) => ({ ...s!, weight: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Colour</label>
              <input
                type="color"
                value={editing.color ?? "#7C3AED"}
                onChange={(e) => setEditing((s) => ({ ...s!, color: e.target.value }))}
                className="h-[38px] w-full rounded-lg border border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={editing.isActive ?? true}
                  onChange={(e) => setEditing((s) => ({ ...s!, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                Active
              </label>
            </div>
          </div>
          <button onClick={save} className="mt-4 flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Save className="h-4 w-4" /> Save
          </button>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : (
        <GlassPanel className="divide-y divide-white/5">
          {segments.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4">
              <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: s.color }} />
              <button onClick={() => setEditing(s)} className="min-w-0 flex-1 text-left">
                <p className={cn("font-medium", s.isActive ? "text-white" : "text-muted line-through")}>{s.label}</p>
                <p className="text-xs text-muted">
                  {s.rewardType.toLowerCase()}
                  {s.coinAmount > 0 && ` · ${s.coinAmount} coins`}
                </p>
              </button>
              <span className="text-xs text-muted">
                weight {s.weight}
                {totalWeight > 0 && s.isActive && ` · ${Math.round((s.weight / totalWeight) * 100)}%`}
              </span>
              <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-muted hover:text-danger" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}

function DailyManager() {
  const { toast } = useToast();
  const [config, setConfig] = useState<DailyConfigDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminPlatformApi.listDaily();
      setConfig(data.data.config);
    } catch {
      setConfig([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDay(day: DailyConfigDTO) {
    try {
      await adminPlatformApi.upsertDaily({
        dayNumber: day.dayNumber,
        label: day.label,
        rewardType: day.rewardType,
        coinAmount: Number(day.coinAmount),
        isActive: day.isActive,
      });
      toast({ variant: "success", title: `Day ${day.dayNumber} saved` });
    } catch (err) {
      toast({ variant: "error", title: "Save failed", description: getApiErrorMessage(err) });
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {config.map((day) => (
        <GlassPanel key={day.id} className="p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted">Day {day.dayNumber}</p>
          <input
            value={day.label}
            onChange={(e) => setConfig((prev) => prev.map((d) => (d.id === day.id ? { ...d, label: e.target.value } : d)))}
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-white focus:outline-none"
            aria-label={`Day ${day.dayNumber} label`}
          />
          <input
            type="number"
            value={day.coinAmount}
            onChange={(e) =>
              setConfig((prev) => prev.map((d) => (d.id === day.id ? { ...d, coinAmount: Number(e.target.value) } : d)))
            }
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm text-white focus:outline-none"
            aria-label={`Day ${day.dayNumber} coins`}
          />
          <button
            onClick={() => saveDay(day)}
            className="w-full rounded-lg bg-white/5 py-1.5 text-xs text-white transition-colors hover:bg-white/10"
          >
            Save
          </button>
        </GlassPanel>
      ))}
    </div>
  );
}

function StoreManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminStoreItemDTO[]>([]);
  const [editing, setEditing] = useState<Partial<AdminStoreItemDTO> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminPlatformApi.listStore();
      setItems(data.data.items);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing?.name?.trim() || !editing.slug?.trim()) return;
    try {
      const payload = {
        slug: editing.slug.trim(),
        name: editing.name.trim(),
        description: editing.description ?? "",
        imageUrl: editing.imageUrl ?? null,
        rarity: editing.rarity ?? "BRONZE",
        price: Number(editing.price ?? 0),
        stock: editing.stock === undefined || editing.stock === null ? null : Number(editing.stock),
        isActive: editing.isActive ?? true,
        order: Number(editing.order ?? items.length + 1),
      };
      if (editing.id) await adminPlatformApi.updateStoreItem(editing.id, payload);
      else await adminPlatformApi.createStoreItem(payload);
      setEditing(null);
      await load();
      toast({ variant: "success", title: "Item saved" });
    } catch (err) {
      toast({ variant: "error", title: "Save failed", description: getApiErrorMessage(err) });
    }
  }

  async function remove(id: string) {
    try {
      await adminPlatformApi.deleteStoreItem(id);
      await load();
      toast({ variant: "success", title: "Item removed" });
    } catch (err) {
      toast({ variant: "error", title: "Failed", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditing({ name: "", slug: "", price: 500, rarity: "BRONZE", isActive: true })}
        className="flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Add Item
      </button>

      {editing && (
        <GlassPanel className="border-primary/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-white">{editing.id ? "Edit item" : "New item"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted hover:text-white" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Name</label>
              <input value={editing.name ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, name: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Slug</label>
              <input value={editing.slug ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, slug: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted">Description</label>
              <textarea value={editing.description ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, description: e.target.value }))}
                rows={2} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Rarity</label>
              <select value={editing.rarity ?? "BRONZE"} onChange={(e) => setEditing((s) => ({ ...s!, rarity: e.target.value as AdminStoreItemDTO["rarity"] }))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:outline-none">
                {RARITIES.map((r) => <option key={r} value={r} className="bg-surface">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Price (coins)</label>
              <input type="number" value={editing.price ?? 0} onChange={(e) => setEditing((s) => ({ ...s!, price: Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Stock (blank = unlimited)</label>
              <input type="number" value={editing.stock ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, stock: e.target.value === "" ? null : Number(e.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-white">
                <input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing((s) => ({ ...s!, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-primary" />
                Active
              </label>
            </div>
          </div>
          <button onClick={save} className="mt-4 flex items-center gap-2 rounded-lg bg-nexplay-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Save className="h-4 w-4" /> Save
          </button>
        </GlassPanel>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : (
        <GlassPanel className="divide-y divide-white/5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <Badge variant="primary">{item.rarity}</Badge>
              <button onClick={() => setEditing(item)} className="min-w-0 flex-1 text-left">
                <p className={cn("font-medium", item.isActive ? "text-white" : "text-muted line-through")}>{item.name}</p>
                <p className="truncate text-xs text-muted">{item.description}</p>
              </button>
              <span className="flex items-center gap-1 text-sm text-white">
                <Coins className="h-3.5 w-3.5 text-accent" />
                {item.price}
              </span>
              <span className="text-xs text-muted">{item.stock === null ? "∞" : `${item.stock} left`}</span>
              <button onClick={() => remove(item.id)} className="rounded-lg p-2 text-muted hover:text-danger" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
