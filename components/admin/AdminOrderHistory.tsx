"use client";

import { ChevronLeft, ChevronRight, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminOrderHistoryOrder } from "@/lib/staff-orders";

type HistoryData = {
  orders: AdminOrderHistoryOrder[];
  page: number;
  pageSize: number;
  total: number;
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

function deliveryLabel(order: AdminOrderHistoryOrder) {
  if (order.deliveryType === "hotel-room") {
    return "Room " + (order.room || "—") + " · Floor " + (order.floor || "—");
  }
  if (order.deliveryType === "pool-area") {
    return "Pool side" + (order.poolLocationDetails ? " · " + order.poolLocationDetails : "");
  }
  return "Collection order";
}

export function AdminOrderHistory() {
  const router = useRouter();
  const [data, setData] = useState<HistoryData>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders/history?page=" + nextPage, { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to load order history.");
      setData(payload);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load order history.");
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => { void load(); }, [load]);

  function changePage(nextPage: number) {
    setPage(nextPage);
  }

  const hasPrevious = page > 1;
  const hasNext = Boolean(data && page * data.pageSize < data.total);

  return (
    <section>
      <header className="flex flex-col gap-4 border-b border-earth/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administration</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Order <i className="text-earth">history.</i></h2>
          <p className="mt-3 text-sm text-forest/65">Delivered and cancelled orders are visible to administrators only.</p>
        </div>
        <button onClick={() => void load()} className="focus-ring inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest sm:self-auto">
          <RefreshCw size={15} />REFRESH
        </button>
      </header>

      <div className="mt-7 flex items-center justify-between">
        <p className="eyebrow">{data ? data.total + " historic order" + (data.total === 1 ? "" : "s") : "Loading history"}</p>
        {loading && <LoaderCircle className="animate-spin text-earth" size={19} />}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        {data?.orders.map((order) => (
          <article key={order.id} className="rounded-[1.5rem] border border-earth/15 bg-cream/75 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className={"rounded-full px-3 py-1 text-[10px] font-bold tracking-[.14em] " + (order.restaurantStatus === "DELIVERED" ? "bg-forest text-cream" : "bg-stone-200 text-stone-700")}>{order.restaurantStatus}</span>
                <h3 className="mt-3 font-display text-2xl">{order.orderNumber}</h3>
                <p className="mt-1 text-xs text-forest/60">{maltaTime(order.createdAt)} · Malta time</p>
              </div>
              <p className="font-display text-2xl text-earth">{formatMoney(order.totalInCents)}</p>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-forest/75"><MapPin size={16} className="text-earth" />{deliveryLabel(order)}</p>
            <ul className="mt-5 space-y-1.5 text-sm">
              {order.items.map((item) => <li key={item.name}>{item.quantity} × {item.name}</li>)}
            </ul>
            {order.customerNotes && <p className="mt-4 border-l-2 border-earth/40 pl-3 text-sm leading-6 text-forest/75"><strong>Notes:</strong> {order.customerNotes}</p>}
          </article>
        ))}
      </section>

      {!loading && data && !data.orders.length && (
        <div className="mt-4 rounded-[1.5rem] border border-earth/15 p-10 text-center">
          <p className="font-display text-2xl">No order history yet.</p>
        </div>
      )}

      {data && data.total > data.pageSize && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-forest/65">Page {data.page}</p>
          <div className="flex gap-2">
            <button disabled={!hasPrevious || loading} onClick={() => changePage(page - 1)} className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] disabled:opacity-45"><ChevronLeft size={15} />PREVIOUS</button>
            <button disabled={!hasNext || loading} onClick={() => changePage(page + 1)} className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] disabled:opacity-45">NEXT<ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
