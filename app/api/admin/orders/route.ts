import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/staff-auth";
import { listAdminLiveOrders } from "@/lib/staff-orders";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET() {
  try {
    if (!(await requireAdminUser())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json(await listAdminLiveOrders());
  } catch (error) {
    logServerFailure("admin.orders.live", error);
    return NextResponse.json({ error: "Unable to load live orders. Please try again later." }, { status: 503 });
  }
}
