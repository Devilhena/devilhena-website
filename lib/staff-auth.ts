import { randomUUID } from "crypto";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { createCredentialSessionToken, credentialVersionForPasswordHash, readCredentialSessionToken, secureValueEqual } from "@/lib/auth-tokens";
import { getDatabase } from "@/lib/db";

const sessionCookieName = "de_vilhena_staff_session";
const sessionLifetimeSeconds = 60 * 60 * 12;
export const userRoles = ["ADMIN", "STAFF"] as const;
export const accountStatuses = ["PENDING", "APPROVED", "REJECTED", "DISABLED"] as const;
export type UserRole = (typeof userRoles)[number];
export type AccountStatus = (typeof accountStatuses)[number];
export type StaffUser = { id: string; fullName: string; email: string; role: UserRole; accountStatus: AccountStatus; createdAt: string; approvedAt?: string; credentialVersion: string };
type UserRow = { id: string; full_name: string; email: string; password_hash: string; role: UserRole; account_status: AccountStatus; created_at: string | Date; approved_at: string | Date | null };

function serializeUser(row: UserRow): StaffUser { return { id: row.id, fullName: row.full_name, email: row.email, role: row.role, accountStatus: row.account_status, createdAt: new Date(row.created_at).toISOString(), credentialVersion: credentialVersionForPasswordHash(row.password_hash), ...(row.approved_at ? { approvedAt: new Date(row.approved_at).toISOString() } : {}) }; }

export function validateNewPassword(password: string) { return password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password); }
export async function createPendingStaffUser(fullName: string, email: string, password: string) {
  const sql = getDatabase(); const normalizedEmail = email.trim().toLowerCase(); const id = randomUUID(); const passwordHash = await hash(password, 12);
  try { await sql`INSERT INTO staff_users (id, full_name, email, password_hash, role, account_status) VALUES (${id}, ${fullName.trim()}, ${normalizedEmail}, ${passwordHash}, 'STAFF', 'PENDING')`; }
  catch (error: unknown) { if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") throw new AuthError("An account with this email already exists.", 409); throw error; }
}
export class AuthError extends Error { constructor(message: string, readonly statusCode: number) { super(message); } }
export async function authenticateUser(email: string, password: string, requiredRole?: UserRole) {
  const sql = getDatabase(); const normalizedEmail = email.trim().toLowerCase(); const rows = await sql`SELECT id, full_name, email, password_hash, role, account_status, created_at, approved_at FROM staff_users WHERE email = ${normalizedEmail} LIMIT 1` as UserRow[]; const row = rows[0];
  if (!row || !(await compare(password, row.password_hash))) throw new AuthError("Unable to sign in with those details.", 401);
  if (row.account_status !== "APPROVED" || (requiredRole && row.role !== requiredRole)) throw new AuthError("Unable to sign in with those details.", 401);
  return serializeUser(row);
}
export async function getAuthenticatedUser() {
  const token = (await cookies()).get(sessionCookieName)?.value; if (!token) return undefined;
  const session = readCredentialSessionToken(token); if (!session) return undefined;
  const sql = getDatabase(); const rows = await sql`SELECT id, full_name, email, password_hash, role, account_status, created_at, approved_at FROM staff_users WHERE id = ${session.userId} LIMIT 1` as UserRow[]; const row = rows[0];
  return row?.account_status === "APPROVED" && secureValueEqual(session.credentialVersion, credentialVersionForPasswordHash(row.password_hash)) ? serializeUser(row) : undefined;
}
export async function requireStaffUser() { const user = await getAuthenticatedUser(); return user?.role === "STAFF" ? user : undefined; }
export async function requireAdminUser() { const user = await getAuthenticatedUser(); return user?.role === "ADMIN" ? user : undefined; }
export function authenticatedSessionCookie(user: Pick<StaffUser, "id" | "credentialVersion">) { return { name: sessionCookieName, value: createCredentialSessionToken(user.id, user.credentialVersion), options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionLifetimeSeconds } }; }
export const expiredStaffSessionCookie = { name: sessionCookieName, value: "", options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 } };
