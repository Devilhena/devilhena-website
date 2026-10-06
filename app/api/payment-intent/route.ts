import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOfficialProduct } from "@/lib/menuCatalog";
import { createPendingOrder, type DeliveryDetails } from "@/lib/orders";
import { getPaymentReturnOrigin } from "@/lib/payment-return-origin";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { logServerFailure } from "@/lib/safe-server-log";
import { getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  attemptId: z.string().uuid(),
  items: z.array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(50) })).min(1).max(100),
  delivery: z.union([
    z.object({ type: z.literal("hotel-room"), guestName: z.string().min(1), phone: z.string().min(1), floor: z.string().min(1), room: z.string().min(1), instructions: z.string().optional() }),
    z.object({ type: z.literal("pool-area"), guestName: z.string().min(1), phone: z.string().min(1), locationDetails: z.string().optional(), instructions: z.string().optional() }),
    z.object({ type: z.literal("pickup"), name: z.string().min(1), phone: z.string().min(1), email: z.string().email(), notes: z.string().optional() }),
  ]),
});

export async function POST(request: NextRequest) {
  try {
    if (!(await enforceRateLimit("payment-intent", [{ name: "ip", value: trustedClientIp(request), limit: 20, windowSeconds: 900 }]))) {
      return NextResponse.json({ error: "Too many payment attempts. Please try again later." }, { status: 429 });
    }
  } catch (error) {
    logServerFailure("payment-intent.rate-limit", error);
    return NextResponse.json({ error: "Payment is temporarily unavailable." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });

  const verifiedItems = parsed.data.items.map(item => ({ product: getOfficialProduct(item.id), quantity: item.quantity }));
  if (verifiedItems.some(item => !item.product)) return NextResponse.json({ error: "One or more menu items are unavailable." }, { status: 400 });

  const lines = verifiedItems.map(({ product, quantity }) => ({
    productId: product!.id,
    name: product!.name,
    category: product!.category,
    quantity,
    unitPriceInCents: product!.priceInCents,
    totalInCents: product!.priceInCents * quantity,
  }));
  const totalInCents = lines.reduce((total, item) => total + item.totalInCents, 0);

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: { checkoutAttemptId: parsed.data.attemptId },
    }, { idempotencyKey: `de-vilhena-payment-${parsed.data.attemptId}` });

    const order = await createPendingOrder({
      items: lines,
      totalInCents,
      delivery: parsed.data.delivery as DeliveryDetails,
      stripePaymentIntentId: intent.id,
    });

    await stripe.paymentIntents.update(intent.id, { metadata: { orderId: order.id, checkoutAttemptId: parsed.data.attemptId } });
    if (!intent.client_secret) throw new Error("Stripe did not return a payment client secret.");

    return NextResponse.json({
      clientSecret: intent.client_secret,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalInCents: order.totalInCents,
      returnUrl: `${getPaymentReturnOrigin(request)}/order/success?order_id=${order.id}`,
    });
  } catch (error) {
    logServerFailure("payment-intent.create", error);
    return NextResponse.json({ error: "Unable to start secure payment. Please try again later." }, { status: 503 });
  }
}
