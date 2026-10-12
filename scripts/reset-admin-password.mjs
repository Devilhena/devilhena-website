import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const prompt = createInterface({ input, output, terminal: true });
try {
  const email = (await prompt.question("Existing admin email: ")).trim().toLowerCase();
  const password = await prompt.question("New password (input will be visible): ");
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) throw new Error("Use the exact existing email and a password with at least 10 characters, uppercase, lowercase, and a number.");
  const sql = neon(databaseUrl);
  const rows = await sql`SELECT id FROM staff_users WHERE email = ${email} AND role = 'ADMIN' LIMIT 1`;
  if (rows.length !== 1) throw new Error("No matching administrator account was found. No changes were made.");
  const passwordHash = await hash(password, 12);
  await sql`UPDATE staff_users SET password_hash = ${passwordHash}, session_version = session_version + 1, updated_at = NOW() WHERE id = ${rows[0].id}`;
  console.log("Administrator password updated and existing sessions invalidated.");
} finally { prompt.close(); }
