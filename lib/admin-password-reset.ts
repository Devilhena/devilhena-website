import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { canonicalProductionOrigin } from "@/lib/canonical-site-url";

const resetLifetimeMs = 15 * 60 * 1000;
const resetPurpose = "admin-password-reset";

type ResetPayload = {
  userId: string;
  sessionVersion: number;
  expiresAt: number;
  nonce: string;
};

function getResetSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Password recovery is not configured.");
  return secret;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getResetSecret()).update(`${resetPurpose}:${encodedPayload}`).digest("base64url");
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAdminPasswordResetToken(userId: string, sessionVersion: number) {
  const payload: ResetPayload = { userId, sessionVersion, expiresAt: Date.now() + resetLifetimeMs, nonce: randomUUID() };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readAdminPasswordResetToken(token: string) {
  const [encodedPayload, signature, ...extra] = token.split(".");
  if (!encodedPayload || !signature || extra.length || !secureEqual(signature, sign(encodedPayload))) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<ResetPayload>;
    if (typeof payload.userId !== "string" || typeof payload.sessionVersion !== "number" || typeof payload.expiresAt !== "number" || typeof payload.nonce !== "string" || payload.expiresAt <= Date.now()) return undefined;
    return { userId: payload.userId, sessionVersion: payload.sessionVersion };
  } catch {
    return undefined;
  }
}

export async function sendAdminPasswordResetEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Password recovery email is not configured.");
  const resetUrl = new URL("/admin/reset-password", canonicalProductionOrigin);
  resetUrl.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your De Vilhena owner password",
      text: `Use this secure link within 15 minutes to reset your De Vilhena owner password:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use the secure link below within 15 minutes to reset your De Vilhena owner password.</p><p><a href="${resetUrl.toString()}">Reset owner password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) throw new Error("Password recovery email could not be sent.");
}
