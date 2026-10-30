"use client";

import { LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminLiveOrder, RestaurantStatus } from "@/lib/staff-orders";

type LiveData = {
  orders: AdminLiveOrder[];
  total: number;
};

const statusTone: Record<RestaurantStatus, string> = {
  NEW: "bg-gold/20 text-forest",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-forest text-cream",
  CANCELLED: "bg-stone-200 text-stone-700",
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-MT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function maltaTime(value: string) {
  return new Intl.DateTimeFormat("en-MT", {
    timeZone: "Europe/Malta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function deliveryLabel(order: AdminLiveOrder) {
  if (order.deliveryType === "hotel-room") {
    return "Room " + (order.room || "—") + " · Floor " + (order.floor || "—");
  }
  if (order.deliveryType === "pool-area") {
    return "Pool side" + (order.poolLocationDetails ? " · " + order.poolLocationDetails : "");
  }
  return "Collection order";
}

function OrderCard({ order }: { order: AdminLiveOrder }) {
  return (
    <article className={"rounded-[1.5rem] border p-5 shadow-sm sm:p-6 " + (order.restaurantStatus === "NEW" ? "border-gold bg-gold/10" : "border-earth/15 bg-cream/75")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={"rounded-full px-3 py-1 text-[10px] font-bold tracking-[.14em] " + statusTone[order.restaurantStatus]}>{order.restaurantStatus}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold tracking-[.14em] text-emerald-800">PAID ONLINE</span>
          </div>
          <h3 className="mt-3 font-display text-2xl">{order.orderNumber}</h3>
          <p className="mt-1 text-xs text-forest/60">{maltaTime(order.createdAt)} · Malta time</p>
        </div>
        <p className="font-display text-2xl text-earth">{formatMoney(order.totalInCents)}</p>
      </div>

      <p className="mt-5 flex items-center gap-2 text-sm text-forest/75"><MapPin size={16} className="text-earth" />{deliveryLabel(order)}</p>
      <div className="mt-5">
        {order.customerName && <p className="text-sm font-semibold">{order.customerName}{order.customerPhone ? " · " + order.customerPhone : ""}</p>}
        {order.customerEmail && <p className="mt-1 text-sm text-forest/65">{order.customerEmail}</p>}
        <ul className="mt-3 space-y-1.5 text-sm">
          {order.items.map((item) => (
            <li key={item.productId + "-" + item.name} className="flex justify-between gap-3">
              <span>{item.quantity} × {item.name}</span>
              <span className="shrink-0 text-earth">{formatMoney(item.totalInCents)}</span>
            </li>
          ))}
        </ul>
        {order.customerNotes && <p className="mt-4 border-l-2 border-earth/40 pl-3 text-sm leading-6 text-forest/75"><strong>Notes:</strong> {order.customerNotes}</p>}
      </div>
    </article>
  );
}

export function AdminOrdersDashboard() {
  const router = useRouter();
  const [data, setData] = useState<LiveData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to load live orders.");
      setData(payload);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load live orders.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <section>
      <header className="flex flex-col gap-4 border-b border-earth/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administration</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Live <i className="text-earth">orders.</i></h2>
          <p className="mt-3 text-sm text-forest/65">A read-only view of current verified paid orders. Staff manage acceptance and delivery.</p>
        </div>
        <button onClick={() => void load()} className="focus-ring inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest sm:self-auto">
          <RefreshCw size={15} />REFRESH
        </button>
      </header>

      <div className="mt-7 flex items-center justify-between">
        <p className="eyebrow">{data ? data.total + " live order" + (data.total === 1 ? "" : "s") : "Loading orders"}</p>
        {loading && <LoaderCircle className="animate-spin text-earth" size={19} />}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        {data?.orders.map((order) => <OrderCard key={order.id} order={order} />)}
      </section>
      {!loading && data && !data.orders.length && (
        <div className="mt-4 rounded-[1.5rem] border border-earth/15 p-10 text-center">
          <p className="font-display text-2xl">No live orders.</p>
          <p className="mt-2 text-sm text-forest/65">New verified paid orders will appear here automatically.</p>
        </div>
      )}
    </section>
  );
}
