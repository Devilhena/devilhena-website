import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { allowAuthAttempt } from "@/lib/auth-rate-limit";
import { authenticateUser, authenticatedSessionCookie, AuthError } from "@/lib/staff-auth";

const credentialsSchema = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });
export async function POST(request: NextRequest) {
  if (!allowAuthAttempt("admin-login", request.headers.get("x-forwarded-for"))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try { const user = await authenticateUser(parsed.data.email, parsed.data.password, "ADMIN"); const response = NextResponse.json({ ok: true }); const cookie = authenticatedSessionCookie(user.id); response.cookies.set(cookie.name, cookie.value, cookie.options); return response; }
  catch (error) { if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.statusCode }); return NextResponse.json({ error: "Administrator authentication is not configured." }, { status: 503 }); }
}
