import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  let event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, secret); } catch { return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 }); }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid" && session.metadata?.orderId) await markOrderPaid(session.metadata.orderId, event.id, session.id, typeof session.payment_intent === "string" ? session.payment_intent : undefined);
  }
  return NextResponse.json({ received: true });
}
