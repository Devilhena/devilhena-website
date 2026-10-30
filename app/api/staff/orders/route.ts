import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/staff-auth";
import { listReadOnlyStaffLiveOrders } from "@/lib/staff-orders";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET() {
  try {
    if (!(await requireStaffUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    return NextResponse.json({ orders: await listReadOnlyStaffLiveOrders() });
  } catch (error) {
    logServerFailure("staff.orders.list", error);
    return NextResponse.json({ error: "Unable to load orders. Please try again later." }, { status: 503 });
  }
}
