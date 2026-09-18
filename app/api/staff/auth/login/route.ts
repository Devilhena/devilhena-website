import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, authenticatedSessionCookie, AuthError } from "@/lib/staff-auth";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { logServerFailure } from "@/lib/safe-server-log";

const credentialsSchema = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });
export async function POST(request: NextRequest) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  try { if (!(await enforceRateLimit("staff-login", [{ name: "ip", value: trustedClientIp(request), limit: 30, windowSeconds: 900 }, { name: "email", value: parsed.data.email.trim().toLowerCase(), limit: 8, windowSeconds: 900 }]))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 }); const user = await authenticateUser(parsed.data.email, parsed.data.password); const response = NextResponse.json({ ok: true }); const cookie = authenticatedSessionCookie(user.id); response.cookies.set(cookie.name, cookie.value, cookie.options); return response; }
  catch (error) { if (error instanceof AuthError) return NextResponse.json({ error: "Unable to sign in with those details." }, { status: 401 }); logServerFailure("staff.login", error); return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again later." }, { status: 503 }); }
}
