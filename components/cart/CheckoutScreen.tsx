"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { DeliveryNoticeModal } from "@/components/DeliveryNoticeModal";
import { formatPrice, useCart } from "./CartProvider";
import { readPaymentSession, savePaymentSession } from "./payment-session";

type FormData = { name: string; phone: string; email: string; orderType: "" | "pickup"; notes: string };
type Delivery =
  | { type: "hotel-room"; guestName: string; phone: string; floor: string; room: string; instructions?: string }
  | { type: "pool-area"; guestName: string; phone: string; locationDetails?: string; instructions?: string }
  | { type: "pickup"; name: string; phone: string; email: string; notes: string };

const empty: FormData = { name: "", phone: "", email: "", orderType: "", notes: "" };

export function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal, hotelDelivery } = useCart();
  const [data, setData] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryNoticeOpen, setDeliveryNoticeOpen] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);

  const set = (key: keyof FormData, value: string) => setData(current => ({ ...current, [key]: value }));
  const field = (key: "name" | "phone" | "email", label: string, type = "text") => (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[.15em] text-earth">{label}</span>
      <input value={data[key]} onChange={event => set(key, event.target.value)} type={type} className="focus-ring mt-2 w-full border-b border-earth/30 bg-transparent py-3 text-sm" aria-invalid={!!errors[key]} />
      {errors[key] && <span className="mt-1 block text-xs text-red-700">{errors[key]}</span>}
    </label>
  );

  function deliveryDetails(): Delivery | undefined {
    const next: Record<string, string> = {};
    if (!items.length) next.order = "Your cart is empty.";
    if (Object.keys(next).length) {
      setErrors(next);
      return undefined;
    }
    if (hotelDelivery) {
      return hotelDelivery.location === "room"
        ? { type: "hotel-room", guestName: hotelDelivery.guestName, phone: hotelDelivery.phone, floor: hotelDelivery.floor || "", room: hotelDelivery.room || "", instructions: hotelDelivery.instructions }
        : { type: "pool-area", guestName: hotelDelivery.guestName, phone: hotelDelivery.phone, locationDetails: hotelDelivery.poolDetails, instructions: hotelDelivery.instructions };
    }
    if (!data.name.trim()) next.name = "Please enter your full name.";
    if (!data.phone.trim()) next.phone = "Please enter your phone number.";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) next.email = "Please enter a valid email.";
    if (!data.orderType) next.orderType = "Choose pickup or hotel delivery.";
    setErrors(next);
    if (Object.keys(next).length) return undefined;
    return { type: "pickup", name: data.name.trim(), phone: data.phone.trim(), email: data.email.trim(), notes: data.notes.trim() };
  }

  async function startPayment(event: React.FormEvent) {
    event.preventDefault();
    const delivery = deliveryDetails();
    if (!delivery || startingPayment) return;
    const fingerprint = JSON.stringify({ items: items.map(item => [item.id, item.quantity]), delivery });
    const existingSession = readPaymentSession();
    if (existingSession?.fingerprint === fingerprint) {
      router.push("/payment");
      return;
    }

    const stored = window.sessionStorage.getItem("de-vilhena-payment-attempt");
    let attemptId = "";
    try {
      const previous = stored ? JSON.parse(stored) as { fingerprint?: string; attemptId?: string } : undefined;
      attemptId = previous?.fingerprint === fingerprint && previous.attemptId ? previous.attemptId : crypto.randomUUID();
    } catch { attemptId = crypto.randomUUID(); }
    window.sessionStorage.setItem("de-vilhena-payment-attempt", JSON.stringify({ fingerprint, attemptId }));

    setStartingPayment(true);
    setErrors({});
    try {
      const response = await fetch("/api/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, items: items.map(item => ({ id: item.id, quantity: item.quantity })), delivery }),
      });
      const payload = await response.json().catch(() => ({})) as { clientSecret?: string; totalInCents?: number; returnUrl?: string; error?: string };
      if (!response.ok || !payload.clientSecret || !payload.returnUrl || typeof payload.totalInCents !== "number") throw new Error(payload.error || "Unable to start secure payment.");
      savePaymentSession({ fingerprint, clientSecret: payload.clientSecret, totalInCents: payload.totalInCents, returnUrl: payload.returnUrl });
      router.push("/payment");
    } catch (error) {
      setErrors({ order: error instanceof Error ? error.message : "Unable to start secure payment." });
    } finally {
      setStartingPayment(false);
    }
  }

  const deliveryContent = hotelDelivery ? (
    <div>
      <p className="eyebrow">Hotel delivery</p>
      <h2 className="mt-3 font-display text-2xl">Delivery details</h2>
      <div className="mt-6 rounded-2xl border border-earth/15 bg-cream/50 p-5 text-sm leading-7">
        <p><strong>Guest:</strong> {hotelDelivery.guestName}</p>
        <p><strong>Phone:</strong> {hotelDelivery.phone}</p>
        <p className="mt-3 flex items-center gap-2 font-semibold"><MapPin size={16} className="text-earth" />{hotelDelivery.location === "room" ? `Hotel Room ${hotelDelivery.room} · ${hotelDelivery.floor}` : "Pool Area"}</p>
        {hotelDelivery.location === "pool" && hotelDelivery.poolDetails && <p><strong>Location details:</strong> {hotelDelivery.poolDetails}</p>}
        {hotelDelivery.instructions && <p><strong>Special instructions:</strong> {hotelDelivery.instructions}</p>}
      </div>
      <Link href="/hotel-delivery" className="focus-ring mt-5 inline-flex text-xs font-semibold tracking-[.12em] text-earth hover:text-forest">EDIT HOTEL DELIVERY DETAILS</Link>
    </div>
  ) : (
    <>
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[.15em] text-earth">Order type</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => set("orderType", "pickup")} className={`focus-ring rounded-full border px-5 py-2 text-xs font-semibold tracking-[.13em] ${data.orderType === "pickup" ? "border-forest bg-forest text-cream" : "border-earth/25 text-forest"}`}>PICKUP</button>
          <button type="button" onClick={() => setDeliveryNoticeOpen(true)} className="focus-ring rounded-full border border-earth/25 px-5 py-2 text-xs font-semibold tracking-[.13em] text-forest">DELIVERY</button>
        </div>
        {errors.orderType && <span className="mt-2 block text-xs text-red-700">{errors.orderType}</span>}
      </fieldset>
      {data.orderType === "pickup" && <>
        <h2 className="mt-10 font-display text-2xl">Customer details</h2>
        <div className="mt-7 grid gap-6 sm:grid-cols-2">{field("name", "Full name")}{field("phone", "Phone number")}{field("email", "Email", "email")}</div>
        <label className="mt-8 block">
          <span className="text-xs font-semibold uppercase tracking-[.15em] text-earth">Order notes (optional)</span>
          <textarea value={data.notes} onChange={event => set("notes", event.target.value)} rows={3} className="focus-ring mt-2 w-full resize-none border-b border-earth/30 bg-transparent py-3 text-sm" />
        </label>
      </>}
    </>
  );

  return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto max-w-3xl"><p className="eyebrow">Checkout</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Almost <i className="text-earth">there.</i></h1><form onSubmit={startPayment} noValidate className="mt-10 rounded-[2rem] bg-beige/45 p-6 sm:p-10">{deliveryContent}<div className="mt-8 border-t border-earth/15 pt-6"><p className="eyebrow">Order total</p><p className="mt-2 font-display text-3xl">{formatPrice(subtotal)}</p><p className="mt-2 text-sm text-forest/65">Your final amount is securely confirmed by the server before payment.</p></div>{errors.order && <span className="mt-5 block text-xs text-red-700">{errors.order}</span>}<button disabled={startingPayment} className="focus-ring mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-6 py-3 text-xs font-semibold tracking-[.15em] text-cream transition hover:bg-earth disabled:cursor-not-allowed disabled:opacity-60">{startingPayment && <LoaderCircle className="animate-spin" size={15} />}{startingPayment ? "LOADING SECURE PAYMENT…" : "PROCEED TO PAYMENT"}</button></form></div>{deliveryNoticeOpen && <DeliveryNoticeModal onClose={() => setDeliveryNoticeOpen(false)} />}</main>;
}
