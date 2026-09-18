type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const windowMs = 15 * 60 * 1000;
const limit = 8;

export function allowAuthAttempt(scope: string, forwardedFor: string | null) {
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
