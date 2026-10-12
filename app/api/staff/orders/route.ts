import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/staff-auth";
import { getNewPaidOrderIds, listStaffOrders } from "@/lib/staff-orders";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireStaffUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { searchParams } = request.nextUrl;
    const rawDate = searchParams.get("date");
    if (rawDate && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return NextResponse.json({ error: "Invalid date filter." }, { status: 400 });
    const rawPage = Number(searchParams.get("page") || "1");
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const filters = { ...(rawDate ? { date: rawDate } : {}), ...(searchParams.get("search") ? { search: searchParams.get("search")! } : {}), page, activeOnly: true };
    const [result, newPaidOrderIds] = await Promise.all([listStaffOrders(filters), getNewPaidOrderIds()]);
    return NextResponse.json({ ...result, newPaidOrderIds });
  } catch (error) {
    logServerFailure("staff.orders.list", error);
    return NextResponse.json({ error: "Unable to load orders. Please try again later." }, { status: 503 });
  }
}
