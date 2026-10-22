import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const passwordResetLifetimeMs = 15 * 60 * 1000;
const credentialVersionPattern = /^[A-Za-z0-9_-]{43}$/;

type CredentialClaims = { userId: string; credentialVersion: string; expiresAt: number };
type ResetClaims = CredentialClaims & { nonce: string };

function getAuthSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Staff authentication is not configured.");
  return secret;
}

export function secureValueEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(purpose: "session" | "admin-password-reset", encodedPayload: string) {
  return createHmac("sha256", getAuthSecret()).update(`${purpose}:${encodedPayload}`).digest("base64url");
}

function signedToken(purpose: "session" | "admin-password-reset", payload: CredentialClaims | ResetClaims) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(purpose, encodedPayload)}`;
}

function readSignedToken(purpose: "session" | "admin-password-reset", token: string) {
  const [encodedPayload, signature, ...extra] = token.split(".");
  if (!encodedPayload || !signature || extra.length || !secureValueEqual(signature, sign(purpose, encodedPayload))) return undefined;
  try { return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<ResetClaims>; }
  catch { return undefined; }
}

function validCredentialClaims(payload: Partial<CredentialClaims>, now: number): payload is CredentialClaims {
  return typeof payload.userId === "string" && payload.userId.length > 0 && typeof payload.credentialVersion === "string" && credentialVersionPattern.test(payload.credentialVersion) && typeof payload.expiresAt === "number" && payload.expiresAt > now;
}

export function credentialVersionForPasswordHash(passwordHash: string) {
  return createHmac("sha256", getAuthSecret()).update(`password-credential:${passwordHash}`).digest("base64url");
}

export function createCredentialSessionToken(userId: string, credentialVersion: string, now = Date.now()) {
  return signedToken("session", { userId, credentialVersion, expiresAt: now + sessionLifetimeMs });
}

export function readCredentialSessionToken(token: string, now = Date.now()) {
  const payload = readSignedToken("session", token);
  return payload && validCredentialClaims(payload, now) ? { userId: payload.userId, credentialVersion: payload.credentialVersion } : undefined;
}

export function createAdminPasswordResetToken(userId: string, credentialVersion: string, now = Date.now()) {
  return signedToken("admin-password-reset", { userId, credentialVersion, expiresAt: now + passwordResetLifetimeMs, nonce: randomUUID() });
}

export function readAdminPasswordResetToken(token: string, now = Date.now()) {
  const payload = readSignedToken("admin-password-reset", token);
  if (!payload || typeof payload.nonce !== "string" || payload.nonce.length === 0 || !validCredentialClaims(payload, now)) return undefined;
  return { userId: payload.userId, credentialVersion: payload.credentialVersion };
}
