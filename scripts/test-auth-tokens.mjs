import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminPasswordResetToken,
  createCredentialSessionToken,
  credentialVersionForPasswordHash,
  readAdminPasswordResetToken,
  readCredentialSessionToken,
  secureValueEqual,
} from "../lib/auth-tokens.ts";

process.env.STAFF_SESSION_SECRET = "test-only-secret-with-at-least-32-characters";

const oldHash = "$2b$12$old-password-hash-for-security-tests";
const newHash = "$2b$12$new-password-hash-for-security-tests";
const issuedAt = 1_800_000_000_000;

test("credential versions are stable, opaque, and change with the password hash", () => {
  const oldVersion = credentialVersionForPasswordHash(oldHash);
  assert.equal(oldVersion, credentialVersionForPasswordHash(oldHash));
  assert.notEqual(oldVersion, credentialVersionForPasswordHash(newHash));
  assert.match(oldVersion, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(oldVersion.includes(oldHash), false);
});

test("password-reset links expire after exactly 15 minutes", () => {
  const version = credentialVersionForPasswordHash(oldHash);
  const token = createAdminPasswordResetToken("admin-id", version, issuedAt);
  assert.deepEqual(readAdminPasswordResetToken(token, issuedAt + 15 * 60 * 1000 - 1), { userId: "admin-id", credentialVersion: version });
  assert.equal(readAdminPasswordResetToken(token, issuedAt + 15 * 60 * 1000), undefined);
});

test("tampered and wrong-purpose tokens are rejected", () => {
  const version = credentialVersionForPasswordHash(oldHash);
  const resetToken = createAdminPasswordResetToken("admin-id", version, issuedAt);
  const sessionToken = createCredentialSessionToken("admin-id", version, issuedAt);
  const tampered = `${resetToken.slice(0, -1)}${resetToken.endsWith("A") ? "B" : "A"}`;
  assert.equal(readAdminPasswordResetToken(tampered, issuedAt), undefined);
  assert.equal(readAdminPasswordResetToken(sessionToken, issuedAt), undefined);
  assert.equal(readCredentialSessionToken(resetToken, issuedAt), undefined);
});

test("password changes invalidate reset links and existing sessions", () => {
  const oldVersion = credentialVersionForPasswordHash(oldHash);
  const newVersion = credentialVersionForPasswordHash(newHash);
  const reset = readAdminPasswordResetToken(createAdminPasswordResetToken("admin-id", oldVersion, issuedAt), issuedAt);
  const session = readCredentialSessionToken(createCredentialSessionToken("admin-id", oldVersion, issuedAt), issuedAt);
  assert.ok(reset);
  assert.ok(session);
  assert.equal(secureValueEqual(reset.credentialVersion, oldVersion), true);
  assert.equal(secureValueEqual(reset.credentialVersion, newVersion), false);
  assert.equal(secureValueEqual(session.credentialVersion, oldVersion), true);
  assert.equal(secureValueEqual(session.credentialVersion, newVersion), false);
});

test("changing the signing secret invalidates issued tokens", () => {
  const version = credentialVersionForPasswordHash(oldHash);
  const token = createAdminPasswordResetToken("admin-id", version, issuedAt);
  process.env.STAFF_SESSION_SECRET = "different-test-secret-with-at-least-32-characters";
  assert.equal(readAdminPasswordResetToken(token, issuedAt), undefined);
  process.env.STAFF_SESSION_SECRET = "test-only-secret-with-at-least-32-characters";
});
