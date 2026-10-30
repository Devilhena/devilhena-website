import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/staff-auth";
import { listAdminOrderHistory } from "@/lib/staff-orders";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminUser())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rawPage = Number(request.nextUrl.searchParams.get("page") || "1");
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    return NextResponse.json(await listAdminOrderHistory(page));
  } catch (error) {
    logServerFailure("admin.orders.history", error);
    return NextResponse.json({ error: "Unable to load order history. Please try again later." }, { status: 503 });
  }
}
