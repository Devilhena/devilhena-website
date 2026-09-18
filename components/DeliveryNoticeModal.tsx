"use client";

import Link from "next/link";
import { X } from "lucide-react";

export function DeliveryNoticeModal({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-end bg-forest/45 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="hotel-delivery-title">
    <button aria-label="Close delivery notice" onClick={onClose} className="absolute inset-0 cursor-default" />
    <section className="relative w-full max-w-lg rounded-[2rem] bg-cream p-6 shadow-2xl sm:p-9">
      <button aria-label="Close delivery notice" onClick={onClose} className="focus-ring absolute right-5 top-5 rounded-full p-2 text-forest/70 hover:text-forest"><X size={18}/></button>
      <p className="eyebrow">Hotel delivery only</p>
      <h2 id="hotel-delivery-title" className="mt-3 pr-8 font-display text-3xl text-forest">Delivery for hotel guests.</h2>
      <p className="mt-5 text-sm leading-7 text-forest/75">Our delivery service is currently available exclusively within the hotel. Order food and drinks from De Vilhena Bistrot and have them delivered directly to your hotel room or the pool area.</p>
      <p className="mt-4 text-sm leading-7 text-forest/75"><strong>Please note:</strong> we are not currently offering delivery to addresses outside the hotel.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/hotel-delivery" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-5 py-3 text-center text-xs font-semibold tracking-[.13em] text-cream transition hover:bg-earth">CONTINUE TO HOTEL DELIVERY</Link>
        <button onClick={onClose} className="focus-ring min-h-12 rounded-full border border-earth/25 px-5 py-3 text-xs font-semibold tracking-[.13em] text-forest transition hover:border-earth">CANCEL / GO BACK</button>
      </div>
    </section>
  </div>;
}
