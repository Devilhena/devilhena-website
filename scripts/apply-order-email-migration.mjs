import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

// This is intentionally active only during the single Vercel Production
// deployment used to introduce Migration 008. It skips local and Preview
// builds, fails closed on an unexpected schema, and is removed immediately
// after the production deployment has completed.
const isVercelProductionBuild = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

if (!isVercelProductionBuild) {
  console.log("Skipping the one-time order-email migration outside Vercel Production.");
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Production database configuration is unavailable.");
  }

  const sql = neon(connectionString);
  const [schema] = await sql.query(`
    SELECT
      to_regclass('public.orders') IS NOT NULL AS orders_table,
      to_regclass('public.order_items') IS NOT NULL AS order_items_table,
      to_regclass('public.stripe_webhook_events') IS NOT NULL AS webhook_events_table,
      to_regprocedure('gen_random_uuid()') IS NOT NULL AS uuid_function,
      to_regclass('public.email_notification_groups') IS NOT NULL AS groups_table,
      to_regclass('public.email_notification_recipients') IS NOT NULL AS recipients_table,
      to_regclass('public.order_email_notifications') IS NOT NULL AS notifications_table,
      to_regclass('public.order_email_delivery_attempts') IS NOT NULL AS attempts_table
  `);

  if (!schema.orders_table || !schema.order_items_table || !schema.webhook_events_table || !schema.uuid_function) {
    throw new Error("Production order schema prerequisites are unavailable.");
  }

  const emailTables = [
    schema.groups_table,
    schema.recipients_table,
    schema.notifications_table,
    schema.attempts_table,
  ].filter(Boolean).length;

  if (emailTables === 4) {
    console.log("Order-email migration is already present.");
  } else if (emailTables !== 0) {
    throw new Error("Order-email schema is partially present and requires a manual review.");
  } else {
    const migration = readFileSync(
      new URL("../db/migrations/008_add_order_email_notifications.sql", import.meta.url),
      "utf8",
    );
    const statements = migration
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);

    await sql.transaction((transaction) => statements.map((statement) => transaction.query(statement)));
    console.log("Order-email migration applied successfully.");
  }
}
