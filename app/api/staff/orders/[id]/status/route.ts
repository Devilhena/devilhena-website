import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffUser } from "@/lib/staff-auth";
import { restaurantStatuses, StaffOrderError, updateRestaurantStatus, type RestaurantStatus } from "@/lib/staff-orders";

const statusSchema = z.object({ status: z.enum(restaurantStatuses) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireStaffUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const parsed = statusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    const order = await updateRestaurantStatus((await params).id, parsed.data.status as RestaurantStatus);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof StaffOrderError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update order." }, { status: 503 });
  }
}
