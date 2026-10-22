import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAdminPasswordResetEmail } from "@/lib/admin-password-reset";
import { createAdminPasswordResetToken, credentialVersionForPasswordHash } from "@/lib/auth-tokens";
import { getDatabase } from "@/lib/db";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { logServerFailure } from "@/lib/safe-server-log";

const requestSchema = z.object({ email: z.string().email().max(200) });
const genericMessage = "If that email belongs to an administrator, a reset link will arrive shortly.";

export async function POST(request: NextRequest) {
  if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  try {
    const allowed = await enforceRateLimit("admin-password-reset-request", [
      { name: "ip", value: trustedClientIp(request), limit: 5, windowSeconds: 3600 },
      { name: "email", value: email, limit: 3, windowSeconds: 3600 },
    ]);
    if (!allowed) return NextResponse.json({ error: "Too many reset requests. Please try again later." }, { status: 429 });
    const sql = getDatabase();
    const rows = await sql`SELECT id, email, password_hash FROM staff_users WHERE email = ${email} AND role = 'ADMIN' AND account_status = 'APPROVED' LIMIT 1` as { id: string; email: string; password_hash: string }[];
    const admin = rows[0];
    if (admin) await sendAdminPasswordResetEmail(admin.email, createAdminPasswordResetToken(admin.id, credentialVersionForPasswordHash(admin.password_hash)));
    return NextResponse.json({ message: genericMessage }, { status: 202 });
  } catch (error) {
    logServerFailure("admin.password-reset.request", error);
    return NextResponse.json({ message: genericMessage }, { status: 202 });
  }
}
