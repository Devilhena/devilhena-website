import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { credentialVersionForPasswordHash, readAdminPasswordResetToken, secureValueEqual } from "@/lib/auth-tokens";
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
    const sql = getDatabase();
    const rows = await sql`SELECT id, password_hash FROM staff_users WHERE id = ${reset.userId} AND role = 'ADMIN' AND account_status = 'APPROVED' LIMIT 1` as { id: string; password_hash: string }[];
    const admin = rows[0];
    if (!admin || !secureValueEqual(reset.credentialVersion, credentialVersionForPasswordHash(admin.password_hash))) return NextResponse.json({ error: "This reset link is invalid or has already been used." }, { status: 400 });
    const passwordHash = await hash(parsed.data.password, 12);
    const updated = await sql`UPDATE staff_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${reset.userId} AND role = 'ADMIN' AND account_status = 'APPROVED' AND password_hash = ${admin.password_hash} RETURNING id` as { id: string }[];
    if (updated.length !== 1) return NextResponse.json({ error: "This reset link is invalid or has already been used." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerFailure("admin.password-reset.complete", error);
    return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
