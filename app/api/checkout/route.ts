import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOfficialProduct } from "@/lib/menuCatalog";
import { createPendingOrder, setCheckoutSession, type DeliveryDetails } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { getCanonicalCheckoutOrigin } from "@/lib/canonical-site-url";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(50) })).min(1).max(100),
  delivery: z.union([
    z.object({ type: z.literal("hotel-room"), guestName: z.string().min(1), phone: z.string().min(1), floor: z.string().min(1), room: z.string().min(1), instructions: z.string().optional() }),
    z.object({ type: z.literal("pool-area"), guestName: z.string().min(1), phone: z.string().min(1), locationDetails: z.string().optional(), instructions: z.string().optional() }),
    z.object({ type: z.literal("pickup"), name: z.string().min(1), phone: z.string().min(1), email: z.string().email(), notes: z.string().optional() }),
  ]),
});

export async function POST(request: NextRequest) {
  try { if (!(await enforceRateLimit("checkout", [{ name: "ip", value: trustedClientIp(request), limit: 20, windowSeconds: 900 }]))) return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 }); } catch { return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 }); }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
  const verifiedItems = parsed.data.items.map(item => ({ product: getOfficialProduct(item.id), quantity: item.quantity }));
  if (verifiedItems.some(item => !item.product)) return NextResponse.json({ error: "One or more menu items are unavailable." }, { status: 400 });
  const lines = verifiedItems.map(({ product, quantity }) => ({ productId: product!.id, name: product!.name, category: product!.category, quantity, unitPriceInCents: product!.priceInCents, totalInCents: product!.priceInCents * quantity }));
  const totalInCents = lines.reduce((total, item) => total + item.totalInCents, 0);
  try {
    const origin = getCanonicalCheckoutOrigin();
    const order = await createPendingOrder({ items: lines, totalInCents, delivery: parsed.data.delivery as DeliveryDetails });
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({ mode: "payment", payment_method_types: ["card"], line_items: lines.map(item => ({ quantity: item.quantity, price_data: { currency: "eur", unit_amount: item.unitPriceInCents, product_data: { name: item.name } } })), metadata: { orderId: order.id }, success_url: `${origin}/order/success?order_id=${order.id}`, cancel_url: `${origin}/order/cancel?order_id=${order.id}` });
    await setCheckoutSession(order.id, session.id);
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start payment." }, { status: 503 });
  }
}
