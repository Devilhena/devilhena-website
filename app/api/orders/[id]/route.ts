import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await getOrder((await params).id);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order: { id: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, totalInCents: order.totalInCents, ...(order.paidAt ? { paidAt: order.paidAt } : {}) } });
  } catch (error) {
    logServerFailure("order-status.get", error);
    return NextResponse.json({ error: "Order status is temporarily unavailable." }, { status: 503 });
  }
}
