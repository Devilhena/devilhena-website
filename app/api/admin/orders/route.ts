import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/staff-auth";
import { listStaffOrders } from "@/lib/staff-orders";
export async function GET(request: NextRequest) { if (!(await requireAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); return NextResponse.json(await listStaffOrders({ ...(request.nextUrl.searchParams.get("search") ? { search: request.nextUrl.searchParams.get("search")! } : {}) })); }
