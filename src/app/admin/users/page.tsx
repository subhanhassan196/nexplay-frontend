"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Search, Shield, ShieldCheck, Ban, Check, X, Loader2, KeyRound } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { adminPlatformApi, type AdminUserDTO, type PermissionsDTO } from "@/lib/api/adminPlatform";
import { getApiErrorMessage } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const ROLES = ["PLAYER", "SUPPORT_AGENT", "MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Player",
  SUPPORT_AGENT: "Support Agent",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_COLOR: Record<string, string> = {
  PLAYER: "text-muted",
  SUPPORT_AGENT: "text-secondary",
  MODERATOR: "text-primary",
  ADMIN: "text-accent",
  SUPER_ADMIN: "text-danger",
};

/**
 * User & access management. Role changes and permission overrides are
 * validated server-side too — the UI hiding a control is a convenience,
 * not the security boundary.
 */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [search, setSearch] = useState("");
  const [staffOnly, setStaffOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permTarget, setPermTarget] = useState<AdminUserDTO | null>(null);
  const [perms, setPerms] = useState<PermissionsDTO | null>(null);
  const [permsLoading, setPermsLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminPlatformApi.listUsers({
        search: search || undefined,
        staffOnly,
        take: 100,
      });
      setUsers(data.data.items);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, staffOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRole(user: AdminUserDTO, role: string) {
    try {
      await adminPlatformApi.setRole(user.id, role);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: role as AdminUserDTO["role"] } : u)));
      toast({ variant: "success", title: "Role updated", description: `${user.username} → ${ROLE_LABEL[role]}` });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't change role", description: getApiErrorMessage(err) });
    }
  }

  async function handleStatus(user: AdminUserDTO, status: string) {
    try {
      await adminPlatformApi.setStatus(user.id, status);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, accountStatus: status as AdminUserDTO["accountStatus"] } : u)));
      toast({ variant: "success", title: "Status updated" });
    } catch (err) {
      toast({ variant: "error", title: "Couldn't update status", description: getApiErrorMessage(err) });
    }
  }

  async function openPermissions(user: AdminUserDTO) {
    setPermTarget(user);
    setPermsLoading(true);
    try {
      const { data } = await adminPlatformApi.getPermissions(user.id);
      setPerms(data.data);
    } catch (err) {
      toast({ variant: "error", title: "Couldn't load permissions", description: getApiErrorMessage(err) });
      setPermTarget(null);
    } finally {
      setPermsLoading(false);
    }
  }

  async function togglePermission(permission: string, currentlyHas: boolean) {
    if (!permTarget) return;
    try {
      await adminPlatformApi.setPermission(permTarget.id, permission, !currentlyHas);
      const { data } = await adminPlatformApi.getPermissions(permTarget.id);
      setPerms(data.data);
    } catch (err) {
      toast({ variant: "error", title: "Couldn't update permission", description: getApiErrorMessage(err) });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Users & Access</h1>
        <p className="text-sm text-muted">Manage roles, account status and individual permissions.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={staffOnly} onChange={(e) => setStaffOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
          Staff only
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : (
        <GlassPanel className="divide-y divide-white/5">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <div key={u.id} className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-nexplay-gradient/30">
                  {u.avatarUrl ? (
                    <Image src={u.avatarUrl} alt={`${u.username} avatar`} fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="m-auto text-xs font-semibold text-white">{u.username.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium text-white">
                    {u.username}
                    {isSelf && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">you</span>}
                    {u.accountStatus !== "ACTIVE" && (
                      <span className="rounded bg-danger/20 px-1.5 py-0.5 text-[10px] text-danger">
                        {u.accountStatus.toLowerCase()}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>

                <span className={cn("flex items-center gap-1.5 text-sm", ROLE_COLOR[u.role])}>
                  {u.role === "SUPER_ADMIN" ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  {ROLE_LABEL[u.role]}
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRole(u, e.target.value)}
                    disabled={isSelf || !isSuperAdmin}
                    className="rounded-lg border border-white/10 bg-surface px-2 py-1.5 text-xs text-white focus:outline-none disabled:opacity-40"
                    aria-label={`Change role for ${u.username}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-surface">
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>

                  {isSuperAdmin && !isSelf && (
                    <button
                      onClick={() => openPermissions(u)}
                      className="rounded-lg p-2 text-muted transition-colors hover:text-white"
                      title="Manage permissions"
                      aria-label={`Manage permissions for ${u.username}`}
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                  )}

                  {!isSelf && (
                    <button
                      onClick={() => handleStatus(u, u.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                      className={cn(
                        "rounded-lg p-2 transition-colors",
                        u.accountStatus === "ACTIVE" ? "text-muted hover:text-danger" : "text-danger hover:text-success"
                      )}
                      title={u.accountStatus === "ACTIVE" ? "Suspend" : "Reactivate"}
                      aria-label={u.accountStatus === "ACTIVE" ? `Suspend ${u.username}` : `Reactivate ${u.username}`}
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </GlassPanel>
      )}

      {/* Permission drawer */}
      {permTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPermTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Permissions for ${permTarget.username}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-background p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Permissions — {permTarget.username}</h2>
                <p className="text-xs text-muted">
                  Baseline comes from their role. Toggling creates an override for this user only.
                </p>
              </div>
              <button onClick={() => setPermTarget(null)} aria-label="Close">
                <X className="h-5 w-5 text-muted hover:text-white" />
              </button>
            </div>

            {permsLoading || !perms ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-1">
                {perms.catalogue.map((p) => {
                  const has = perms.effective.includes(p);
                  const isBaseline = perms.baseline.includes(p);
                  const override = perms.overrides.find((o) => o.permission === p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePermission(p, has)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded",
                            has ? "bg-success/20 text-success" : "bg-white/5 text-muted"
                          )}
                        >
                          {has ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </span>
                        <span className="font-mono text-sm text-white">{p}</span>
                      </span>
                      <span className="text-[10px] text-muted">
                        {override ? (override.granted ? "granted" : "denied") : isBaseline ? "from role" : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
