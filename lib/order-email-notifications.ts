import { getDatabase } from "@/lib/db";
import { getOrder, type RestaurantOrder } from "@/lib/orders";
import { assertPreviewEmailDeliveryAccess } from "@/lib/preview-deployment-guard";

export const emailRecipientGroups = ["MANAGEMENT", "KITCHEN", "BAR"] as const;
export type EmailRecipientGroup = (typeof emailRecipientGroups)[number];
export type EmailNotificationStatus = "PENDING" | "SENDING" | "SENT" | "FAILED";

type RecipientRow = { id: string; recipient_group: EmailRecipientGroup; email: string; enabled: boolean };
type GroupRow = { recipient_group: EmailRecipientGroup; enabled: boolean };
type NotificationRow = {
  id: string; order_id: string; recipient_group: EmailRecipientGroup; recipient_email: string;
  status: EmailNotificationStatus; attempt_count: number; available_at: Date | string;
};

export type EmailNotificationSettings = Record<EmailRecipientGroup, { enabled: boolean; recipients: string[] }>;

const recipientGroups = new Set<string>(emailRecipientGroups);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxAutomaticAttempts = 8;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function money(cents: number) {
  return new Intl.NumberFormat("en-MT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function maltaTime(value: string) {
  return new Intl.DateTimeFormat("en-MT", { timeZone: "Europe/Malta", dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function deliveryLabel(order: RestaurantOrder) {
  if (order.delivery.type === "hotel-room") return `Hotel room ${order.delivery.room || "not provided"}, ${order.delivery.floor || "floor not provided"}`;
  if (order.delivery.type === "pool-area") return `Pool-side delivery${order.delivery.locationDetails ? ` — ${order.delivery.locationDetails}` : ""}`;
  return "Pickup from De Vilhena Bistrot";
}

function notes(order: RestaurantOrder) {
  if (order.delivery.type === "hotel-room" || order.delivery.type === "pool-area") return order.delivery.instructions;
  return order.delivery.notes;
}

function isDrink(item: RestaurantOrder["items"][number]) {
  return item.productId.startsWith("drinks:") || item.productId.startsWith("wines:");
}

function itemsForGroup(order: RestaurantOrder, group: EmailRecipientGroup) {
  return group === "BAR" ? order.items.filter(isDrink) : order.items;
}

function emailBody(order: RestaurantOrder, group: EmailRecipientGroup) {
  const items = itemsForGroup(order, group);
  const preparation = group !== "MANAGEMENT";
  const itemText = items.map((item) => preparation ? `${item.quantity} × ${item.name}` : `${item.quantity} × ${item.name} — ${money(item.unitPriceInCents)} each — ${money(item.totalInCents)}`);
  const itemHtml = items.map((item) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e8dfd1">${item.quantity} × ${escapeHtml(item.name)}</td>${preparation ? "" : `<td style="padding:8px 0;border-bottom:1px solid #e8dfd1;text-align:right">${escapeHtml(money(item.unitPriceInCents))}</td><td style="padding:8px 0;border-bottom:1px solid #e8dfd1;text-align:right">${escapeHtml(money(item.totalInCents))}</td>`}</tr>`).join("");
  const orderTime = maltaTime(order.paidAt || order.createdAt);
  const base = [
    "De Vilhena Bistrot",
    "",
    preparation ? "New preparation order" : "New paid order",
    `Order number: ${order.orderNumber}`,
    `Date and time (Malta): ${orderTime}`,
    `Delivery: ${deliveryLabel(order)}`,
    "",
    "Items:",
    ...itemText,
  ];
  if (notes(order)) base.push("", `Special instructions: ${notes(order)}`);
  if (!preparation) base.push("", `Total paid: ${money(order.totalInCents)}`, "Payment status: PAID", `Stripe payment reference: ${order.stripePaymentIntentId || order.stripeCheckoutSessionId || "Recorded with order"}`);
  const heading = preparation ? "New preparation order" : "New paid order";
  const paymentSection = preparation ? "" : `<p><strong>Total paid:</strong> ${escapeHtml(money(order.totalInCents))}<br/><strong>Payment status:</strong> PAID<br/><strong>Stripe payment reference:</strong> ${escapeHtml(order.stripePaymentIntentId || order.stripeCheckoutSessionId || "Recorded with order")}</p>`;
  const columns = preparation ? "" : "<th style=\"text-align:right;padding-bottom:8px\">Unit price</th><th style=\"text-align:right;padding-bottom:8px\">Line total</th>";
  const html = `<div style="font-family:Arial,sans-serif;color:#203d2d;max-width:680px;margin:auto;padding:28px;background:#fbf6ed"><h1 style="font-family:Georgia,serif;margin:0 0 20px">${heading}</h1><p><strong>De Vilhena Bistrot</strong><br/>Order <strong>${escapeHtml(order.orderNumber)}</strong><br/>${escapeHtml(orderTime)} (Malta)<br/>${escapeHtml(deliveryLabel(order))}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding-bottom:8px">Items</th>${columns}</tr></thead><tbody>${itemHtml}</tbody></table>${notes(order) ? `<p><strong>Special instructions:</strong><br/>${escapeHtml(notes(order)!)}</p>` : ""}${paymentSection}</div>`;
  return { subject: `${preparation ? "Preparation" : "Paid"} order ${order.orderNumber} — De Vilhena Bistrot`, text: base.join("\n"), html };
}

function configuredSender() {
  assertPreviewEmailDeliveryAccess();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email notification delivery is not configured.");
  return { apiKey, from };
}

async function sendResendEmail(to: string, subject: string, text: string, html: string, idempotencyKey: string) {
  const { apiKey, from } = configuredSender();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(8_000),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string };
  if (!response.ok || !payload.id) throw Object.assign(new Error("Email provider delivery failed."), { providerStatus: response.status });
  return payload.id;
}

function blankSettings(): EmailNotificationSettings {
  return { MANAGEMENT: { enabled: true, recipients: [] }, KITCHEN: { enabled: true, recipients: [] }, BAR: { enabled: true, recipients: [] } };
}

export async function getEmailNotificationSettings(): Promise<EmailNotificationSettings> {
  const sql = getDatabase();
  const rows = await sql`SELECT id, recipient_group, email, enabled FROM email_notification_recipients ORDER BY recipient_group, lower(email)` as RecipientRow[];
  const groupRows = await sql`SELECT recipient_group, enabled FROM email_notification_groups` as GroupRow[];
  const settings = blankSettings();
  for (const row of rows) settings[row.recipient_group].recipients.push(row.email);
  for (const row of groupRows) settings[row.recipient_group].enabled = row.enabled;
  return settings;
}

export async function saveEmailNotificationSettings(input: EmailNotificationSettings) {
  const sql = getDatabase();
  for (const group of emailRecipientGroups) {
    const setting = input[group];
    const recipients = [...new Set(setting.recipients.map((email) => email.trim().toLowerCase()).filter(Boolean))];
    if (recipients.length > 20 || recipients.some((email) => !emailPattern.test(email))) throw new Error("Invalid notification recipient settings.");
    await sql`INSERT INTO email_notification_groups (recipient_group, enabled) VALUES (${group}, ${setting.enabled}) ON CONFLICT (recipient_group) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`;
    await sql`DELETE FROM email_notification_recipients WHERE recipient_group = ${group}`;
    for (const email of recipients) await sql`INSERT INTO email_notification_recipients (recipient_group, email, enabled) VALUES (${group}, ${email}, ${setting.enabled})`;
  }
  return getEmailNotificationSettings();
}

async function claimNotification(id: string) {
  const sql = getDatabase();
  const rows = await sql`
    WITH candidate AS (
      SELECT id FROM order_email_notifications
      WHERE id = ${id}
        AND (status IN ('PENDING', 'FAILED') AND available_at <= NOW() OR status = 'SENDING' AND locked_at < NOW() - INTERVAL '10 minutes')
      FOR UPDATE SKIP LOCKED
    )
    UPDATE order_email_notifications AS notification
    SET status = 'SENDING', attempt_count = attempt_count + 1, locked_at = NOW(), last_attempt_at = NOW(), updated_at = NOW()
    WHERE notification.id IN (SELECT id FROM candidate)
    RETURNING notification.*
  ` as NotificationRow[];
  return rows[0];
}

async function recordAttempt(id: string, outcome: "SENT" | "RETRY" | "FAILED", providerStatus?: number) {
  const sql = getDatabase();
  await sql`INSERT INTO order_email_delivery_attempts (notification_id, outcome, provider_status) VALUES (${id}, ${outcome}, ${providerStatus ?? null})`;
}

async function markNotificationSent(notification: NotificationRow, resendId: string) {
  const sql = getDatabase();
  await sql`UPDATE order_email_notifications SET status = 'SENT', resend_email_id = ${resendId}, sent_at = NOW(), locked_at = NULL, last_error_code = NULL, updated_at = NOW() WHERE id = ${notification.id} AND status = 'SENDING'`;
  await recordAttempt(notification.id, "SENT");
}

async function markNotificationFailed(notification: NotificationRow, providerStatus?: number) {
  const sql = getDatabase();
  const retrySeconds = notification.attempt_count >= maxAutomaticAttempts ? 86_400 : Math.min(3_600, 30 * 2 ** Math.max(0, notification.attempt_count - 1));
  await sql`UPDATE order_email_notifications SET status = 'FAILED', available_at = NOW() + (${retrySeconds} * INTERVAL '1 second'), locked_at = NULL, last_error_code = 'DELIVERY_FAILED', updated_at = NOW() WHERE id = ${notification.id} AND status = 'SENDING'`;
  await recordAttempt(notification.id, notification.attempt_count >= maxAutomaticAttempts ? "FAILED" : "RETRY", providerStatus);
}

export async function dispatchDueOrderEmails(limit = 25) {
  const sql = getDatabase();
  const safeLimit = Math.max(1, Math.min(limit, 25));
  const due = await sql`SELECT id FROM order_email_notifications WHERE (status IN ('PENDING', 'FAILED') AND available_at <= NOW()) OR (status = 'SENDING' AND locked_at < NOW() - INTERVAL '10 minutes') ORDER BY available_at ASC LIMIT ${safeLimit}` as { id: string }[];
  let sent = 0;
  let failed = 0;
  for (const row of due) {
    const notification = await claimNotification(row.id);
    if (!notification) continue;
    try {
      const order = await getOrder(notification.order_id);
      if (!order || order.paymentStatus !== "PAID" || !order.paidAt) throw new Error("Verified paid order data unavailable.");
      const content = emailBody(order, notification.recipient_group);
      if (!itemsForGroup(order, notification.recipient_group).length) {
        await markNotificationSent(notification, "NO_APPLICABLE_ITEMS");
        continue;
      }
      const resendId = await sendResendEmail(notification.recipient_email, content.subject, content.text, content.html, `de-vilhena-order-email/${notification.id}`);
      await markNotificationSent(notification, resendId);
      sent += 1;
    } catch (error) {
      const providerStatus = typeof error === "object" && error && "providerStatus" in error && typeof error.providerStatus === "number" ? error.providerStatus : undefined;
      await markNotificationFailed(notification, providerStatus);
      failed += 1;
    }
  }
  return { processed: due.length, sent, failed };
}

export async function sendEmailNotificationTest(group: EmailRecipientGroup) {
  if (!recipientGroups.has(group)) throw new Error("Invalid notification group.");
  const settings = await getEmailNotificationSettings();
  if (!settings[group].enabled || !settings[group].recipients.length) throw new Error("No enabled recipients are configured for this group.");
  const heading = group === "MANAGEMENT" ? "Management notification test" : `${group[0]}${group.slice(1).toLowerCase()} preparation notification test`;
  for (const recipient of settings[group].recipients) await sendResendEmail(recipient, `${heading} — De Vilhena Bistrot`, `${heading}\n\nThis is a test email. No customer order or payment was processed.`, `<div style="font-family:Arial,sans-serif;color:#203d2d"><h1>${escapeHtml(heading)}</h1><p>This is a test email. No customer order or payment was processed.</p></div>`, `de-vilhena-order-email-test/${group}/${recipient}/${Date.now()}`);
  return { sent: settings[group].recipients.length };
}
