import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}
