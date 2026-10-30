"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ManagedStaffUser, StaffAccountAction } from "@/lib/admin-staff";

type Data = {
  staff: ManagedStaffUser[];
  summary: { pending: number; approved: number; disabled: number };
};

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en-MT", {
      timeZone: "Europe/Malta",
      dateStyle: "medium",
    }).format(new Date(value))
    : "—";
}

function actionsFor(status: ManagedStaffUser["accountStatus"]): StaffAccountAction[] {
  if (status === "PENDING") return ["APPROVE", "REJECT"];
  if (status === "APPROVED") return ["DISABLE"];
  if (status === "DISABLED") return ["REENABLE"];
  return ["APPROVE"];
}

export function AdminStaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Data>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/staff", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to load staff.");
      setData(payload);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load staff.");
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: StaffAccountAction) {
    setBusy(id + ":" + action);
    try {
      const response = await fetch("/api/admin/staff/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to update account.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update account.");
    } finally {
      setBusy("");
    }
  }

  const groups: Array<[string, ManagedStaffUser["accountStatus"]]> = [
    ["Pending approvals", "PENDING"],
    ["Approved staff", "APPROVED"],
    ["Disabled staff", "DISABLED"],
    ["Rejected requests", "REJECTED"],
  ];

  return (
    <section>
      <header className="flex flex-col gap-4 border-b border-earth/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administration</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Staff <i className="text-earth">access.</i></h2>
          <p className="mt-3 text-sm text-forest/65">Only administrators can approve, disable, or re-enable staff accounts.</p>
        </div>
        <button onClick={() => void load()} className="focus-ring inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest sm:self-auto">
          <RefreshCw size={15} />REFRESH
        </button>
      </header>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 rounded-2xl bg-beige/55 px-5 py-4 text-sm text-forest/75">
        <span><strong className="font-display text-2xl text-forest">{data?.summary.pending ?? "—"}</strong> pending</span>
        <span><strong className="font-display text-2xl text-forest">{data?.summary.approved ?? "—"}</strong> approved</span>
        <span><strong className="font-display text-2xl text-forest">{data?.summary.disabled ?? "—"}</strong> disabled</span>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {groups.map(([title, status]) => {
        const users = data?.staff.filter((user) => user.accountStatus === status) || [];
        return (
          <section key={status} className="mt-9">
            <h3 className="font-display text-3xl">{title}</h3>
            {!data ? <LoaderCircle className="mt-5 animate-spin text-earth" /> : !users.length ? <p className="mt-4 text-sm text-forest/65">No accounts in this group.</p> : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {users.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-earth/15 bg-cream/70 p-5">
                    <p className="font-display text-2xl">{user.fullName}</p>
                    <p className="mt-1 text-sm text-forest/70">{user.email}</p>
                    <p className="mt-4 text-xs text-forest/60">Registered: {formatDate(user.createdAt)}{user.approvedAt ? " · Approved: " + formatDate(user.approvedAt) : ""}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {actionsFor(user.accountStatus).map((action) => (
                        <button
                          key={action}
                          disabled={busy === user.id + ":" + action}
                          onClick={() => void act(user.id, action)}
                          className={"focus-ring min-h-10 rounded-full px-4 text-xs font-semibold tracking-[.12em] " + (action === "REJECT" || action === "DISABLE" ? "border border-red-300 text-red-700" : "bg-forest text-cream")}
                        >
                          {busy === user.id + ":" + action ? "UPDATING…" : action === "REENABLE" ? "RE-ENABLE" : action}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </section>
  );
}
