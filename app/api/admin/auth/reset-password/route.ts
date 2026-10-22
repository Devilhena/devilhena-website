import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readAdminPasswordResetToken } from "@/lib/admin-password-reset";
import { getDatabase } from "@/lib/db";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { logServerFailure } from "@/lib/safe-server-log";
import { validateNewPassword } from "@/lib/staff-auth";

const resetSchema = z.object({ token: z.string().min(20).max(2000), password: z.string().max(200) });

export async function POST(request: NextRequest) {
  if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const parsed = resetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validateNewPassword(parsed.data.password)) return NextResponse.json({ error: "Use at least 10 characters with uppercase, lowercase, and a number." }, { status: 400 });
  try {
    const allowed = await enforceRateLimit("admin-password-reset-complete", [{ name: "ip", value: trustedClientIp(request), limit: 10, windowSeconds: 3600 }]);
    if (!allowed) return NextResponse.json({ error: "Too many attempts. Please request a new reset link later." }, { status: 429 });
    const reset = readAdminPasswordResetToken(parsed.data.token);
    if (!reset) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    const passwordHash = await hash(parsed.data.password, 12);
    const sql = getDatabase();
    const updated = await sql`UPDATE staff_users SET password_hash = ${passwordHash}, session_version = session_version + 1, updated_at = NOW() WHERE id = ${reset.userId} AND role = 'ADMIN' AND account_status = 'APPROVED' AND session_version = ${reset.sessionVersion} RETURNING id` as { id: string }[];
    if (updated.length !== 1) return NextResponse.json({ error: "This reset link is invalid or has already been used." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerFailure("admin.password-reset.complete", error);
    return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
