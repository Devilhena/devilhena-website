import { NextRequest, NextResponse } from "next/server";
import { expiredStaffSessionCookie } from "@/lib/staff-auth";
import { hasCanonicalOrigin } from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(expiredStaffSessionCookie.name, expiredStaffSessionCookie.value, expiredStaffSessionCookie.options);
  return response;
}
