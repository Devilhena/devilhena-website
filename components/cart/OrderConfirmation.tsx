"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatPrice, useCart } from "./CartProvider";

type Result = { status: "PENDING_PAYMENT" | "PAID"; orderNumber: string; totalInCents: number };
export function OrderConfirmation({ orderId }: { orderId: string }) {
  const { clear } = useCart(); const [result, setResult] = useState<Result>();
  useEffect(() => { let active = true; const check = async () => { const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" }); if (!response.ok || !active) return; const { order } = await response.json(); if (!active) return; setResult(order); if (order.status === "PAID") clear(); }; check(); const timer = window.setInterval(check, 2500); return () => { active = false; window.clearInterval(timer); }; }, [orderId, clear]);
  if (!result) return <main className="min-h-screen px-5 pb-20 pt-32"><div className="mx-auto max-w-xl rounded-[2rem] bg-beige/45 p-8 text-center"><p className="eyebrow">Payment confirmation</p><h1 className="mt-3 font-display text-4xl">Checking your payment…</h1></div></main>;
  const paid = result.status === "PAID";
  return <main className="min-h-screen px-5 pb-20 pt-32"><div className="mx-auto max-w-xl rounded-[2rem] bg-beige/45 p-8 text-center"><CheckCircle2 className="mx-auto text-forest" size={42}/><p className="eyebrow mt-5">{paid ? "Payment confirmed" : "Payment processing"}</p><h1 className="mt-3 font-display text-4xl">{paid ? "Thank you." : "We’re confirming your payment."}</h1><p className="mt-5 text-sm leading-7 text-forest/70">Order {result.orderNumber} · {formatPrice(result.totalInCents / 100)}{paid ? ". Your hotel order has been confirmed." : ". This page will update once Stripe confirms the payment."}</p>{paid && <Link href="/menu" className="focus-ring mt-7 inline-flex rounded-full bg-forest px-5 py-3 text-xs font-semibold tracking-[.15em] text-cream">RETURN TO MENU</Link>}</div></main>;
}
