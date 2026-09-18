import { createHmac } from "crypto";
import { getDatabase } from "@/lib/db";

type Limit = { name: string; value: string; limit: number; windowSeconds: number };

function getRateLimitSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Rate limiting is not configured.");
  return secret;
}

function hashedKey(scope: string, name: string, value: string) {
  return createHmac("sha256", getRateLimitSecret()).update(`${scope}:${name}:${value}`).digest("hex");
}

export function trustedClientIp(request: Request) {
  // Vercel sets this header from the requester IP. Do not trust forwarding
  // headers in non-Vercel environments, where callers could provide their own.
  if (!request.headers.get("x-vercel-id")) return "non-vercel";
  return request.headers.get("x-vercel-forwarded-for") || "unknown";
}

export async function enforceRateLimit(scope: string, limits: Limit[]) {
  const sql = getDatabase();
  await sql`DELETE FROM rate_limit_windows WHERE expires_at <= NOW()`;
  for (const item of limits) {
    const now = Date.now();
    const windowMs = item.windowSeconds * 1000;
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    const expiresAt = new Date(windowStart.getTime() + windowMs);
    const key = hashedKey(scope, item.name, item.value);
    const rows = await sql`
      INSERT INTO rate_limit_windows (rate_limit_key, window_start, expires_at, request_count)
      VALUES (${key}, ${windowStart.toISOString()}, ${expiresAt.toISOString()}, 1)
      ON CONFLICT (rate_limit_key, window_start)
      DO UPDATE SET request_count = rate_limit_windows.request_count + 1
      RETURNING request_count
    ` as { request_count: number }[];
    if (Number(rows[0]?.request_count) > item.limit) return false;
  }
  return true;
}
