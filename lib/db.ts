import { neon } from "@neondatabase/serverless";
import { assertPreviewDatabaseAccess } from "@/lib/preview-deployment-guard";

/**
 * Creates a database client only when a server-side request needs it.
 * DATABASE_URL must never be exposed with the NEXT_PUBLIC_ prefix.
 */
export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Database is not configured.");
  }

  assertPreviewDatabaseAccess(connectionString);
  return neon(connectionString);
}
