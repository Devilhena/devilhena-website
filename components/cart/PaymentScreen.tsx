"use client";

import Image from "next/image";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { EmbeddedPaymentForm } from "./EmbeddedPaymentForm";
import { formatPrice } from "./CartProvider";
import { readPaymentSession, type PaymentSession } from "./payment-session";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export function PaymentScreen() {
  const [paymentSession, setPaymentSession] = useState<PaymentSession>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPaymentSession(readPaymentSession());
    setLoaded(true);
  }, []);

  if (!loaded) return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto max-w-3xl rounded-[2rem] bg-beige/45 p-8"><p className="eyebrow">Secure payment</p><p className="mt-3 text-sm text-forest/65">Loading secure payment…</p></div></main>;

  if (!paymentSession || !stripePromise) return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto max-w-3xl rounded-[2rem] bg-beige/45 p-8"><p className="eyebrow">Secure payment</p><h1 className="mt-3 font-display text-3xl">Your payment session is unavailable.</h1><p className="mt-4 text-sm leading-7 text-forest/65">Return to checkout to review your delivery details and start payment again.</p><Link href="/checkout" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-xs font-semibold tracking-[.15em] text-cream"><ArrowLeft size={15} />BACK TO CHECKOUT</Link></div></main>;

  return <main className="min-h-screen px-5 pb-20 pt-32 lg:px-10"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px]"><section className="rounded-[2rem] bg-beige/45 p-6 sm:p-10"><div className="flex items-center gap-4"><Image src="/de-vihelhana-logo.jpeg" alt="De Vilhena Bistrot" width={58} height={58} className="h-[58px] w-[58px] rounded-full object-contain" priority /><div><p className="eyebrow">De Vilhena Bistrot</p><h1 className="mt-1 font-display text-4xl">Secure Payment</h1></div></div><p className="mt-6 text-sm leading-7 text-forest/65">Complete your order securely without leaving De Vilhena Bistrot.</p><Elements stripe={stripePromise} options={{ clientSecret: paymentSession.clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#254132", colorText: "#254132", colorBackground: "#f8f3e8", borderRadius: "14px" } } }}><EmbeddedPaymentForm amountInCents={paymentSession.totalInCents} returnUrl={paymentSession.returnUrl} /></Elements><Link href="/checkout" className="focus-ring mt-8 inline-flex items-center gap-2 text-xs font-semibold tracking-[.12em] text-earth hover:text-forest"><ArrowLeft size={14} />BACK TO CHECKOUT</Link></section><aside className="h-fit rounded-[2rem] border border-earth/15 bg-cream/55 p-7 lg:sticky lg:top-28"><p className="eyebrow">Payment total</p><p className="mt-3 font-display text-4xl">{formatPrice(paymentSession.totalInCents / 100)}</p><div className="mt-7 flex gap-3 border-t border-earth/15 pt-6 text-sm leading-6 text-forest/65"><LockKeyhole className="mt-1 shrink-0 text-earth" size={16} /><p>Payments are securely processed by Stripe. Your card details are never sent to our servers.</p></div></aside></div></main>;
}
