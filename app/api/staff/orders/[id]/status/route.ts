import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffUser } from "@/lib/staff-auth";
import { StaffOrderError, updateRestaurantStatus } from "@/lib/staff-orders";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { logServerFailure } from "@/lib/safe-server-log";

const statusSchema = z.object({ status: z.enum(["ACCEPTED", "DELIVERED"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaffUser();
    if (!staff) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    const parsed = statusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    const order = await updateRestaurantStatus((await params).id, parsed.data.status, staff.id);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof StaffOrderError) return NextResponse.json({ error: "Unable to update the order." }, { status: error.statusCode });
    logServerFailure("staff.order-status.update", error);
    return NextResponse.json({ error: "Unable to update the order." }, { status: 503 });
  }
}
