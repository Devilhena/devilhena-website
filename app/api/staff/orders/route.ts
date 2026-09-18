import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/staff-auth";
import { getNewPaidOrderIds, getStaffSummary, listStaffOrders, restaurantStatuses, type RestaurantStatus, type StaffPaymentStatus } from "@/lib/staff-orders";
import { logServerFailure } from "@/lib/safe-server-log";

const paymentStatuses: StaffPaymentStatus[] = ["PENDING", "PAID"];

export async function GET(request: NextRequest) {
  try {
    if (!(await requireStaffUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { searchParams } = request.nextUrl;
    const rawStatus = searchParams.get("status");
    const rawPayment = searchParams.get("payment");
    const rawDate = searchParams.get("date");
    if (rawStatus && !restaurantStatuses.includes(rawStatus as RestaurantStatus)) return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    if (rawPayment && !paymentStatuses.includes(rawPayment as StaffPaymentStatus)) return NextResponse.json({ error: "Invalid payment filter." }, { status: 400 });
    if (rawDate && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return NextResponse.json({ error: "Invalid date filter." }, { status: 400 });
    const rawPage = Number(searchParams.get("page") || "1");
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const filters = { ...(rawStatus ? { status: rawStatus as RestaurantStatus } : {}), ...(rawPayment ? { payment: rawPayment as StaffPaymentStatus } : {}), ...(rawDate ? { date: rawDate } : {}), ...(searchParams.get("search") ? { search: searchParams.get("search")! } : {}), page };
    const [result, summary, newPaidOrderIds] = await Promise.all([listStaffOrders(filters), getStaffSummary(), getNewPaidOrderIds()]);
    return NextResponse.json({ ...result, summary, newPaidOrderIds });
  } catch (error) {
    logServerFailure("staff.orders.list", error);
    return NextResponse.json({ error: "Unable to load orders. Please try again later." }, { status: 503 });
  }
}
