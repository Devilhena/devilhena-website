import { after, NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { markOrderPaid } from "@/lib/orders";
import { dispatchDueOrderEmails } from "@/lib/order-email-notifications";
import { getStripe } from "@/lib/stripe";
import { logServerFailure } from "@/lib/safe-server-log";

const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupportedPaymentEvent(type: string): type is "checkout.session.completed" | "checkout.session.async_payment_succeeded" {
  return type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded";
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is temporarily unavailable." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  let event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, secret); } catch { return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 }); }
  try {
    if (isSupportedPaymentEvent(event.type)) {
      // Stripe's typed Event union is not narrowed by a runtime event-name
      // guard, but these two signed event names always contain a Checkout
      // Session. The following runtime checks still validate every field used.
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const amountTotalInCents = session.amount_total;
      const currency = session.currency?.toLowerCase();
      if (
        session.mode === "payment" &&
        session.payment_status === "paid" &&
        typeof orderId === "string" &&
        orderIdPattern.test(orderId) &&
        typeof amountTotalInCents === "number" &&
        Number.isSafeInteger(amountTotalInCents) &&
        amountTotalInCents >= 0 &&
        currency === "eur"
      ) {
        const { markedPaid } = await markOrderPaid({
          orderId,
          eventId: event.id,
          eventType: event.type,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          amountTotalInCents,
          currency: "eur",
        });
        if (markedPaid) {
          after(async () => {
            try {
              await dispatchDueOrderEmails();
            } catch (error) {
              logServerFailure("stripe.webhook.order-email-dispatch", error);
            }
          });
        }
      }
    }
  } catch (error) {
    logServerFailure("stripe.webhook.process", error);
    return NextResponse.json({ error: "Webhook processing is temporarily unavailable." }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}
