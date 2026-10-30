import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { logServerFailure } from "@/lib/safe-server-log";

const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const allowed = await enforceRateLimit("order-status", [
      { name: "ip", value: trustedClientIp(request), limit: 60, windowSeconds: 15 * 60 },
    ]);
    if (!allowed) {
      return NextResponse.json({ error: "Too many status checks. Please try again later." }, { status: 429 });
    }

    const id = (await params).id;
    if (!orderIdPattern.test(id)) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order: { id: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, totalInCents: order.totalInCents, ...(order.paidAt ? { paidAt: order.paidAt } : {}) } });
  } catch (error) {
    logServerFailure("order-status.get", error);
    return NextResponse.json({ error: "Order status is temporarily unavailable." }, { status: 503 });
  }
}
