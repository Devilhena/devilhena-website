import { getDatabase } from "@/lib/db";
import type { OrderLine } from "@/lib/orders";

export const restaurantStatuses = ["NEW", "ACCEPTED", "PREPARING", "READY", "DELIVERED", "CANCELLED"] as const;
export type RestaurantStatus = (typeof restaurantStatuses)[number];
export type StaffPaymentStatus = "PENDING" | "PAID";

export type StaffOrder = {
  id: string; orderNumber: string; createdAt: string; paidAt?: string; restaurantStatus: RestaurantStatus; paymentStatus: StaffPaymentStatus;
  customerName?: string; customerPhone?: string; customerEmail?: string; deliveryType: "hotel-room" | "pool-area" | "pickup";
  floor?: string; room?: string; poolLocationDetails?: string; customerNotes?: string; totalInCents: number;
  stripeCheckoutSessionId?: string; stripePaymentIntentId?: string; items: OrderLine[];
};

type OrderRow = {
  id: string; order_number: string; created_at: string | Date; paid_at: string | Date | null; restaurant_status: RestaurantStatus; payment_status: StaffPaymentStatus;
  customer_name: string | null; customer_phone: string | null; customer_email: string | null; delivery_type: StaffOrder["deliveryType"];
  floor: string | null; room: string | null; pool_location_details: string | null; customer_notes: string | null; total_amount_cents: number;
  stripe_checkout_session_id: string | null; stripe_payment_intent_id: string | null;
};
type ItemRow = { product_id: string; product_name: string; category: string; quantity: number; unit_price_cents: number; line_total_cents: number };

export type StaffOrderFilters = { status?: RestaurantStatus; payment?: StaffPaymentStatus; search?: string; date?: string; page?: number };

const asIso = (value: string | Date) => new Date(value).toISOString();
const activeStatuses: RestaurantStatus[] = ["NEW", "ACCEPTED", "PREPARING", "READY"];

function mapOrder(row: OrderRow, items: ItemRow[]): StaffOrder {
  return {
    id: row.id, orderNumber: row.order_number, createdAt: asIso(row.created_at), restaurantStatus: row.restaurant_status, paymentStatus: row.payment_status,
    ...(row.paid_at ? { paidAt: asIso(row.paid_at) } : {}), ...(row.customer_name ? { customerName: row.customer_name } : {}), ...(row.customer_phone ? { customerPhone: row.customer_phone } : {}), ...(row.customer_email ? { customerEmail: row.customer_email } : {}),
    deliveryType: row.delivery_type, ...(row.floor ? { floor: row.floor } : {}), ...(row.room ? { room: row.room } : {}), ...(row.pool_location_details ? { poolLocationDetails: row.pool_location_details } : {}), ...(row.customer_notes ? { customerNotes: row.customer_notes } : {}),
    totalInCents: row.total_amount_cents, ...(row.stripe_checkout_session_id ? { stripeCheckoutSessionId: row.stripe_checkout_session_id } : {}), ...(row.stripe_payment_intent_id ? { stripePaymentIntentId: row.stripe_payment_intent_id } : {}),
    items: items.map((item) => ({ productId: item.product_id, name: item.product_name, category: item.category, quantity: item.quantity, unitPriceInCents: item.unit_price_cents, totalInCents: item.line_total_cents })),
  };
}

export async function listStaffOrders(filters: StaffOrderFilters = {}) {
  const sql = getDatabase();
  const limit = 30;
  const page = Math.max(1, Math.min(filters.page || 1, 10000));
  const offset = (page - 1) * limit;
  const status = filters.status ?? null;
  const payment = filters.payment ?? null;
  const date = filters.date ?? null;
  const search = filters.search?.trim().slice(0, 80) || null;
  const pattern = search ? `%${search}%` : null;
  const rows = await sql`
    SELECT id, order_number, created_at, paid_at, restaurant_status, payment_status, customer_name, customer_phone, customer_email,
      delivery_type, floor, room, pool_location_details, customer_notes, total_amount_cents, stripe_checkout_session_id, stripe_payment_intent_id
    FROM orders
    WHERE (${status}::text IS NULL OR restaurant_status = ${status})
      AND (${payment}::text IS NULL OR payment_status = ${payment})
      AND (${date}::text IS NULL OR (created_at AT TIME ZONE 'Europe/Malta')::date = ${date}::date)
      AND (${pattern}::text IS NULL OR order_number ILIKE ${pattern} OR COALESCE(room, '') ILIKE ${pattern})
    ORDER BY
      CASE WHEN restaurant_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY') THEN 0 ELSE 1 END ASC,
      CASE WHEN restaurant_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY') THEN created_at END ASC NULLS LAST,
      CASE WHEN restaurant_status IN ('DELIVERED', 'CANCELLED') THEN created_at END DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  ` as OrderRow[];
  const countRows = await sql`
    SELECT COUNT(*)::int AS total FROM orders
    WHERE (${status}::text IS NULL OR restaurant_status = ${status})
      AND (${payment}::text IS NULL OR payment_status = ${payment})
      AND (${date}::text IS NULL OR (created_at AT TIME ZONE 'Europe/Malta')::date = ${date}::date)
      AND (${pattern}::text IS NULL OR order_number ILIKE ${pattern} OR COALESCE(room, '') ILIKE ${pattern})
  ` as { total: number }[];
  const orders = await Promise.all(rows.map(async (row) => {
    const items = await sql`SELECT product_id, product_name, category, quantity, unit_price_cents, line_total_cents FROM order_items WHERE order_id = ${row.id} ORDER BY id` as ItemRow[];
    return mapOrder(row, items);
  }));
  return { orders, page, pageSize: limit, total: Number(countRows[0]?.total || 0) };
}

export async function getStaffSummary() {
  const sql = getDatabase();
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE restaurant_status = 'NEW' AND payment_status = 'PAID')::int AS new_orders,
      COUNT(*) FILTER (WHERE restaurant_status IN ('ACCEPTED', 'PREPARING', 'READY') AND payment_status = 'PAID')::int AS active_orders,
      COUNT(*) FILTER (WHERE restaurant_status = 'DELIVERED' AND (delivered_at AT TIME ZONE 'Europe/Malta')::date = (NOW() AT TIME ZONE 'Europe/Malta')::date)::int AS completed_today,
      COUNT(*) FILTER (WHERE payment_status = 'PAID' AND (paid_at AT TIME ZONE 'Europe/Malta')::date = (NOW() AT TIME ZONE 'Europe/Malta')::date)::int AS paid_orders_today,
      COALESCE(SUM(total_amount_cents) FILTER (WHERE payment_status = 'PAID' AND (paid_at AT TIME ZONE 'Europe/Malta')::date = (NOW() AT TIME ZONE 'Europe/Malta')::date), 0)::int AS paid_sales_today,
      COUNT(*) FILTER (WHERE restaurant_status = 'PREPARING' AND payment_status = 'PAID')::int AS preparing_orders,
      COUNT(*) FILTER (WHERE restaurant_status = 'READY' AND payment_status = 'PAID')::int AS ready_orders,
      COUNT(*) FILTER (WHERE restaurant_status = 'DELIVERED' AND (delivered_at AT TIME ZONE 'Europe/Malta')::date = (NOW() AT TIME ZONE 'Europe/Malta')::date)::int AS delivered_today
    FROM orders
  ` as Record<string, number>[];
  const row = rows[0] || {};
  return { newOrders: Number(row.new_orders || 0), activeOrders: Number(row.active_orders || 0), completedToday: Number(row.completed_today || 0), paidOrdersToday: Number(row.paid_orders_today || 0), paidSalesToday: Number(row.paid_sales_today || 0), preparingOrders: Number(row.preparing_orders || 0), readyOrders: Number(row.ready_orders || 0), deliveredToday: Number(row.delivered_today || 0) };
}

export async function getNewPaidOrderIds() {
  const sql = getDatabase();
  const rows = await sql`SELECT id FROM orders WHERE restaurant_status = 'NEW' AND payment_status = 'PAID' ORDER BY created_at DESC LIMIT 50` as { id: string }[];
  return rows.map((row) => row.id);
}

export class StaffOrderError extends Error { constructor(message: string, readonly statusCode: number) { super(message); } }

const transitions: Record<RestaurantStatus, RestaurantStatus[]> = { NEW: ["ACCEPTED", "CANCELLED"], ACCEPTED: ["PREPARING", "CANCELLED"], PREPARING: ["READY", "CANCELLED"], READY: ["DELIVERED", "CANCELLED"], DELIVERED: [], CANCELLED: [] };

export async function updateRestaurantStatus(id: string, nextStatus: RestaurantStatus) {
  const sql = getDatabase();
  const currentRows = await sql`SELECT restaurant_status, payment_status FROM orders WHERE id = ${id}` as { restaurant_status: RestaurantStatus; payment_status: StaffPaymentStatus }[];
  const current = currentRows[0];
  if (!current) throw new StaffOrderError("Order not found.", 404);
  if (current.payment_status !== "PAID") throw new StaffOrderError("Only verified paid orders can enter the restaurant workflow.", 409);
  if (!transitions[current.restaurant_status].includes(nextStatus)) throw new StaffOrderError("That status change is not allowed.", 409);
  const updated = await sql`
    UPDATE orders SET restaurant_status = ${nextStatus}, updated_at = NOW(),
      accepted_at = CASE WHEN ${nextStatus} = 'ACCEPTED' THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
      preparing_at = CASE WHEN ${nextStatus} = 'PREPARING' THEN COALESCE(preparing_at, NOW()) ELSE preparing_at END,
      ready_at = CASE WHEN ${nextStatus} = 'READY' THEN COALESCE(ready_at, NOW()) ELSE ready_at END,
      delivered_at = CASE WHEN ${nextStatus} = 'DELIVERED' THEN COALESCE(delivered_at, NOW()) ELSE delivered_at END,
      cancelled_at = CASE WHEN ${nextStatus} = 'CANCELLED' THEN COALESCE(cancelled_at, NOW()) ELSE cancelled_at END
    WHERE id = ${id} AND restaurant_status = ${current.restaurant_status} AND payment_status = 'PAID'
    RETURNING id
  ` as { id: string }[];
  if (!updated[0]) throw new StaffOrderError("This order changed. Refresh and try again.", 409);
  return { id, restaurantStatus: nextStatus };
}
