import { NextRequest, NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/staff-auth";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { acknowledgeOrder } from "@/lib/staff-orders";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaffUser();
  if (!staff) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  await acknowledgeOrder((await params).id, staff.id);
  return NextResponse.json({ ok: true });
}
