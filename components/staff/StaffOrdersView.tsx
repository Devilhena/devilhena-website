"use client";

import { BellRing, LoaderCircle, LogOut, MapPin, RefreshCw, Square, Upload, UtensilsCrossed, Volume2, VolumeX } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReadOnlyStaffLiveOrder, RestaurantStatus } from "@/lib/staff-orders";

type Data = { orders: ReadOnlyStaffLiveOrder[] };

const ringtoneNameKey = "dv-order-ringtone-name";
const ringtoneDatabase = "de-vilhena-staff";
const ringtoneStore = "settings";
const ringtoneRecord = "order-ringtone";
const maxRingtoneBytes = 8 * 1024 * 1024;

const statusTone: Record<RestaurantStatus, string> = {
  NEW: "bg-gold/20 text-forest",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-forest text-cream",
  CANCELLED: "bg-stone-200 text-stone-700",
};

function maltaTime(value: string) {
  return new Intl.DateTimeFormat("en-MT", {
    timeZone: "Europe/Malta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function fallbackRing() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
  } catch {
    // A browser may block audio until the user enables it.
  }
}

function openRingtoneDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(ringtoneDatabase, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(ringtoneStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredRingtone() {
  const database = await openRingtoneDatabase();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const request = database.transaction(ringtoneStore, "readonly").objectStore(ringtoneStore).get(ringtoneRecord);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

async function storeRingtone(file: File) {
  const database = await openRingtoneDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(ringtoneStore, "readwrite").objectStore(ringtoneStore).put(file, ringtoneRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

function DeliveryDetails({ order }: { order: ReadOnlyStaffLiveOrder }) {
  if (order.deliveryType === "hotel-room") {
    return <p className="mt-2 font-display text-xl">Room {order.room || "—"} <span className="text-sm">· Floor {order.floor || "—"}</span></p>;
  }
  if (order.deliveryType === "pool-area") {
    return <p className="mt-2 flex items-center gap-2 font-display text-xl"><MapPin size={18} />Pool side{order.poolLocationDetails ? " · " + order.poolLocationDetails : ""}</p>;
  }
  return <p className="mt-2 font-display text-xl">Collection order</p>;
}

export function StaffOrdersView() {
  const router = useRouter();
  const [data, setData] = useState<Data>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notice, setNotice] = useState("");
  const [ringingOrderNumbers, setRingingOrderNumbers] = useState<string[]>([]);
  const [ringtoneName, setRingtoneName] = useState("");
  const [ringtoneError, setRingtoneError] = useState("");
  const seenOrderNumbers = useRef(new Set<string>());
  const initialized = useRef(false);
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const audioUrl = useRef<string | undefined>(undefined);

  const setRingtoneBlob = useCallback((blob?: Blob) => {
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = undefined;
    audio.current?.pause();
    audio.current = undefined;
    if (!blob) return;
    audioUrl.current = URL.createObjectURL(blob);
    audio.current = new Audio(audioUrl.current);
    audio.current.preload = "auto";
  }, []);

  const playSound = useCallback(() => {
    const selected = audio.current;
    if (!selected) {
      fallbackRing();
      return;
    }
    selected.pause();
    selected.currentTime = 0;
    void selected.play().catch(fallbackRing);
  }, []);

  const stopAlarm = useCallback(() => {
    setNotice("");
    setRingingOrderNumbers([]);
    audio.current?.pause();
    if (audio.current) audio.current.currentTime = 0;
  }, []);

  const handleNotifications = useCallback((orderNumbers: string[]) => {
    const stored = new Set<string>(JSON.parse(localStorage.getItem("dv-staff-seen-paid-orders") || "[]"));
    setRingingOrderNumbers((current) => current.filter((number) => orderNumbers.includes(number)));

    if (!initialized.current) {
      orderNumbers.forEach((number) => stored.add(number));
      seenOrderNumbers.current = stored;
      initialized.current = true;
      localStorage.setItem("dv-staff-seen-paid-orders", JSON.stringify(Array.from(stored).slice(-200)));
      return;
    }

    const fresh = orderNumbers.filter((number) => !seenOrderNumbers.current.has(number));
    if (!fresh.length) return;
    fresh.forEach((number) => seenOrderNumbers.current.add(number));
    setRingingOrderNumbers((current) => Array.from(new Set([...current, ...fresh])));
    localStorage.setItem("dv-staff-seen-paid-orders", JSON.stringify(Array.from(seenOrderNumbers.current).slice(-200)));
    setNotice(fresh.length + " new paid order" + (fresh.length === 1 ? "" : "s") + " received");
    if (soundEnabled) playSound();
    if (soundEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification("De Vilhena Bistrot", {
        body: fresh.length + " new paid order" + (fresh.length === 1 ? "" : "s") + " is waiting.",
      });
    }
  }, [playSound, soundEnabled]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/staff/orders", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/staff/login");
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to load current orders.");
      setData(payload);
      handleNotifications((payload.orders || []).filter((order: ReadOnlyStaffLiveOrder) => order.restaurantStatus === "NEW").map((order: ReadOnlyStaffLiveOrder) => order.orderNumber));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load current orders.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [handleNotifications, router]);

  useEffect(() => {
    const stored = localStorage.getItem("dv-staff-sound-enabled") === "true";
    setSoundEnabled(stored);
    setRingtoneName(localStorage.getItem(ringtoneNameKey) || "");
    void readStoredRingtone().then(setRingtoneBlob).catch(() => setRingtoneError("Your saved ringtone could not be loaded. You can select it again."));
    void load();
    const timer = window.setInterval(() => void load(true), 15000);
    return () => {
      window.clearInterval(timer);
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    };
  }, [load, setRingtoneBlob]);

  useEffect(() => {
    if (!soundEnabled || !ringingOrderNumbers.length) return;
    const timer = window.setInterval(playSound, 5000);
    return () => window.clearInterval(timer);
  }, [playSound, ringingOrderNumbers.length, soundEnabled]);

  async function toggleSound() {
    const next = !soundEnabled;
    if (next && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    localStorage.setItem("dv-staff-sound-enabled", String(next));
    setSoundEnabled(next);
    if (next) playSound();
  }

  async function chooseRingtone(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".mp3") && file.size <= maxRingtoneBytes) {
      try {
        await storeRingtone(file);
        setRingtoneBlob(file);
        setRingtoneName(file.name);
        localStorage.setItem(ringtoneNameKey, file.name);
        setRingtoneError("");
      } catch {
        setRingtoneError("This tablet could not save the ringtone. Try a smaller MP3 file.");
      }
      return;
    }
    setRingtoneError("Choose an MP3 file up to 8 MB.");
  }

  async function logout() {
    await fetch("/api/staff/auth/logout", { method: "POST" });
    router.replace("/staff/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-earth/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">De Vilhena Bistrot</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">Current <i className="text-earth">orders.</i></h1>
            <p className="mt-3 text-sm text-forest/65">Verified paid orders only · no order actions · Malta time</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest">
              <Upload size={15} />{ringtoneName ? "RINGTONE SELECTED" : "CHOOSE MP3"}
              <input type="file" accept="audio/mpeg,.mp3" className="sr-only" onChange={chooseRingtone} />
            </label>
            <button onClick={() => void toggleSound()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}{soundEnabled ? "SOUND ON" : "ENABLE ORDER SOUND"}
            </button>
            <button onClick={() => void load()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest">
              <RefreshCw size={15} />REFRESH
            </button>
            <button onClick={() => void logout()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-earth/25 px-4 text-xs font-semibold tracking-[.12em] text-forest">
              <LogOut size={15} />SIGN OUT
            </button>
          </div>
        </header>

        {ringtoneName && <p className="mt-3 text-xs text-forest/60">Ringtone: {ringtoneName}</p>}
        {ringtoneError && <p role="alert" className="mt-3 text-sm text-red-700">{ringtoneError}</p>}
        {notice && (
          <div role="status" className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-gold/20 p-4 text-sm font-semibold text-forest">
            <BellRing size={19} />{notice}
            <button onClick={stopAlarm} className="focus-ring ml-auto inline-flex items-center gap-2 text-xs underline">
              <Square size={14} />STOP ALARM
            </button>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between">
          <p className="eyebrow">{data ? data.orders.length + " current order" + (data.orders.length === 1 ? "" : "s") : "Loading orders"}</p>
          {loading && <LoaderCircle className="animate-spin text-earth" size={19} />}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          {data?.orders.map((order) => (
            <article key={order.orderNumber} className="rounded-[1.5rem] border border-earth/15 bg-cream/75 p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={"rounded-full px-3 py-1 text-[10px] font-bold tracking-[.14em] " + statusTone[order.restaurantStatus]}>{order.restaurantStatus}</span>
                  <h2 className="mt-3 font-display text-2xl">{order.orderNumber}</h2>
                  <p className="mt-1 text-xs text-forest/60">{maltaTime(order.createdAt)} · Malta time</p>
                </div>
                <UtensilsCrossed className="text-earth" size={21} />
              </div>
              <div className={"mt-5 rounded-2xl p-4 " + (order.deliveryType === "hotel-room" ? "bg-forest text-cream" : "bg-beige/70 text-forest")}>
                <p className={"text-[10px] font-semibold tracking-[.18em] " + (order.deliveryType === "hotel-room" ? "text-clay" : "text-earth")}>
                  {order.deliveryType === "hotel-room" ? "ROOM DELIVERY" : order.deliveryType === "pool-area" ? "POOL SIDE" : "PICKUP"}
                </p>
                <DeliveryDetails order={order} />
              </div>
              <div className="mt-5">
                <p className="eyebrow">Order</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {order.items.map((item) => <li key={item.name} className="flex gap-3"><span className="font-semibold">{item.quantity} ×</span><span>{item.name}</span></li>)}
                </ul>
                {order.customerNotes && <p className="mt-4 border-l-2 border-earth/40 pl-3 text-sm leading-6 text-forest/75"><strong>Notes:</strong> {order.customerNotes}</p>}
              </div>
            </article>
          ))}
        </section>

        {!loading && data && !data.orders.length && (
          <div className="mt-4 rounded-[1.5rem] border border-earth/15 p-10 text-center">
            <UtensilsCrossed className="mx-auto text-earth" />
            <p className="mt-4 font-display text-2xl">No current orders.</p>
            <p className="mt-2 text-sm text-forest/65">New verified paid orders will appear here automatically.</p>
          </div>
        )}
      </div>
    </main>
  );
}
