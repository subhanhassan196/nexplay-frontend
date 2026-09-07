"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Coins, Lock, Check, Loader2, Store } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { BonusWheel } from "@/components/shared/BonusWheel";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { rewardsApi, type DailyStatusDTO, type StoreItemDTO } from "@/lib/api/platform";
import { getApiErrorMessage } from "@/lib/api/axios";
import { formatCompactNumber, cn } from "@/lib/utils";

const RARITY_VARIANT: Record<string, "primary" | "secondary" | "accent"> = {
  PLATINUM: "secondary",
  GOLD: "accent",
  SILVER: "primary",
  BRONZE: "accent",
};

/**
 * Rewards hub. Daily ladder, wheel and store all read from the API —
 * the reward amounts, wheel segments and store catalogue are configured
 * in the database, not written into this component.
 */
export default function RewardsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [balance, setBalance] = useState(0);
  const [daily, setDaily] = useState<DailyStatusDTO | null>(null);
  const [items, setItems] = useState<StoreItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const storeRes = await rewardsApi.storeItems();
      setItems(storeRes.data.data.items);

      if (isAuthenticated) {
        const [balRes, dailyRes] = await Promise.all([rewardsApi.balance(), rewardsApi.dailyStatus()]);
        setBalance(balRes.data.data.balance);
        setDaily(dailyRes.data.data);
      }
    } catch {
      /* leave empty state */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const { data } = await rewardsApi.claimDaily();
      setBalance(data.data.balance);
      await load();
      toast({ variant: "success", title: "Reward claimed!", description: data.data.label });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't claim", description: getApiErrorMessage(err) });
    } finally {
      setClaiming(false);
    }
  }

  async function handleRedeem(item: StoreItemDTO) {
    setRedeeming(item.id);
    try {
      const { data } = await rewardsApi.redeem(item.id);
      setBalance(data.data.balance);
      await load();
      toast({ variant: "success", title: "Redeemed!", description: item.name });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't redeem", description: getApiErrorMessage(err) });
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div className="container-nexplay section-padding pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Rewards"
          title="Earn &"
          highlight="Redeem"
          description="Claim daily rewards, spin the bonus wheel, and redeem coins for profile cosmetics."
        />
        {isAuthenticated && (
          <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-3">
            <Coins className="h-5 w-5 text-accent" />
            <span className="font-display text-xl font-bold text-white">{formatCompactNumber(balance)}</span>
            <span className="text-sm text-muted">Coins</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Daily rewards */}
        <GlassPanel className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-white">
              Daily Login Rewards
            </h2>
          </div>

          {!isAuthenticated ? (
            <p className="py-8 text-center text-sm text-muted">Log in to start your daily reward streak.</p>
          ) : isLoading || !daily ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                {daily.config.map((day) => {
                  const isClaimed = day.dayNumber <= daily.currentStreak;
                  const isNext = day.dayNumber === daily.nextDayNumber && daily.canClaim;
                  return (
                    <div
                      key={day.id}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
                        isNext
                          ? "border-primary bg-primary/10"
                          : isClaimed
                            ? "border-success/30 bg-success/5"
                            : "border-white/10"
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-wide text-muted">Day {day.dayNumber}</span>
                      {isClaimed ? (
                        <Check className="h-5 w-5 text-success" />
                      ) : isNext ? (
                        <Coins className="h-5 w-5 text-accent" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted" />
                      )}
                      <span className="text-xs text-white">{day.label}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleClaim}
                disabled={!daily.canClaim || claiming}
                className={cn(
                  "mt-4 w-full rounded-xl px-6 py-3 font-medium transition-all",
                  daily.canClaim && !claiming
                    ? "bg-nexplay-gradient text-white hover:opacity-90"
                    : "cursor-not-allowed bg-white/5 text-muted"
                )}
              >
                {claiming ? "Claiming…" : daily.canClaim ? "Claim today's reward" : "Already claimed today"}
              </button>
            </>
          )}
        </GlassPanel>

        {/* Wheel */}
        <BonusWheel onBalanceChange={setBalance} />
      </div>

      {/* Store */}
      <div className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-white">Reward Store</h2>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">The store is being restocked — check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const affordable = balance >= item.price;
              const outOfStock = item.stock !== null && item.stock <= 0;
              return (
                <GlassPanel key={item.id} className="flex flex-col p-5">
                  <Badge variant={RARITY_VARIANT[item.rarity] ?? "primary"}>{item.rarity}</Badge>

                  <div className="my-5 flex flex-1 items-center justify-center">
                    <Coins className="h-14 w-14 text-accent" />
                  </div>

                  <h3 className="font-display font-semibold text-white">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="flex items-center gap-1.5 text-white">
                      <Coins className="h-4 w-4 text-accent" />
                      {formatCompactNumber(item.price)}
                    </span>
                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={!isAuthenticated || !affordable || outOfStock || redeeming === item.id}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        isAuthenticated && affordable && !outOfStock
                          ? "bg-nexplay-gradient text-white hover:opacity-90"
                          : "cursor-not-allowed bg-white/5 text-muted"
                      )}
                    >
                      {redeeming === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : outOfStock ? (
                        "Sold out"
                      ) : (
                        "Redeem"
                      )}
                    </button>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted/70">
          Coins and cosmetics are profile rewards only — they have no cash value and cannot be withdrawn or exchanged.
        </p>
      </div>
    </div>
  );
}
