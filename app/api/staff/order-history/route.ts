import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/staff-auth";
import { listStaffOrders, restaurantStatuses, type RestaurantStatus, type StaffPaymentStatus } from "@/lib/staff-orders";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireStaffUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const params = request.nextUrl.searchParams; const rawStatus = params.get("status"); const rawPayment = params.get("payment"); const rawDate = params.get("date");
    if (rawStatus && !restaurantStatuses.includes(rawStatus as RestaurantStatus)) return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    if (rawPayment && !["PENDING", "PAID"].includes(rawPayment)) return NextResponse.json({ error: "Invalid payment filter." }, { status: 400 });
    return NextResponse.json(await listStaffOrders({ ...(rawStatus ? { status: rawStatus as RestaurantStatus } : {}), ...(rawPayment ? { payment: rawPayment as StaffPaymentStatus } : {}), ...(rawDate ? { date: rawDate } : {}), ...(params.get("search") ? { search: params.get("search")! } : {}), archived: params.get("archived") === "true" }));
  } catch (error) { logServerFailure("staff.order-history.list", error); return NextResponse.json({ error: "Unable to load order history." }, { status: 503 }); }
}
