import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, createPendingStaffUser, validateNewPassword } from "@/lib/staff-auth";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { logServerFailure } from "@/lib/safe-server-log";

const signupSchema = z.object({ fullName: z.string().trim().min(2).max(120), email: z.string().email().max(200), password: z.string().min(10).max(200), confirmPassword: z.string().min(1).max(200) });
export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid name, email, and password." }, { status: 400 });
  if (parsed.data.password !== parsed.data.confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  if (!validateNewPassword(parsed.data.password)) return NextResponse.json({ error: "Use at least 10 characters, including uppercase, lowercase, and a number." }, { status: 400 });
  try { if (!(await enforceRateLimit("staff-signup", [{ name: "ip", value: trustedClientIp(request), limit: 10, windowSeconds: 3600 }, { name: "email", value: parsed.data.email.trim().toLowerCase(), limit: 3, windowSeconds: 86400 }]))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 }); await createPendingStaffUser(parsed.data.fullName, parsed.data.email, parsed.data.password); return NextResponse.json({ ok: true }, { status: 201 }); }
  catch (error) { if (error instanceof AuthError) return NextResponse.json({ ok: true }, { status: 201 }); logServerFailure("staff.signup", error); return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again later." }, { status: 503 }); }
}
