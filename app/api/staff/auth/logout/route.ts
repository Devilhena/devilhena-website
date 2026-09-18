import { NextResponse } from "next/server";
import { expiredStaffSessionCookie } from "@/lib/staff-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(expiredStaffSessionCookie.name, expiredStaffSessionCookie.value, expiredStaffSessionCookie.options);
  return response;
}
