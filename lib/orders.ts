import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/db";

export type OrderLine = {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
};

export type DeliveryDetails =
  | { type: "hotel-room"; guestName: string; phone: string; floor: string; room: string; instructions?: string }
  | { type: "pool-area"; guestName: string; phone: string; locationDetails?: string; instructions?: string }
  | { type: "pickup"; name: string; phone: string; email: string; notes?: string };

export type RestaurantOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: "PENDING_PAYMENT" | "PAID";
  paymentStatus: "PENDING" | "PAID";
  items: OrderLine[];
  totalInCents: number;
  delivery: DeliveryDetails;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  processedWebhookEventIds: string[];
  paidAt?: string;
};

type OrderInput = Omit<RestaurantOrder, "id" | "orderNumber" | "createdAt" | "status" | "paymentStatus" | "processedWebhookEventIds">;

type DatabaseOrder = {
  id: string;
  order_number: string;
  created_at: string | Date;
  paid_at: string | Date | null;
  order_status: RestaurantOrder["status"];
  payment_status: RestaurantOrder["paymentStatus"];
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_type: DeliveryDetails["type"];
  floor: string | null;
  room: string | null;
  pool_location_details: string | null;
  customer_notes: string | null;
  total_amount_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type DatabaseOrderItem = {
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

const asIsoString = (value: string | Date) => new Date(value).toISOString();

function deliveryFields(delivery: DeliveryDetails) {
  if (delivery.type === "hotel-room") {
    return { customerName: delivery.guestName, customerPhone: delivery.phone, customerEmail: null, floor: delivery.floor, room: delivery.room, poolLocationDetails: null, customerNotes: delivery.instructions || null };
  }

  if (delivery.type === "pool-area") {
    return { customerName: delivery.guestName, customerPhone: delivery.phone, customerEmail: null, floor: null, room: null, poolLocationDetails: delivery.locationDetails || null, customerNotes: delivery.instructions || null };
  }

  return { customerName: delivery.name, customerPhone: delivery.phone, customerEmail: delivery.email, floor: null, room: null, poolLocationDetails: null, customerNotes: delivery.notes || null };
}

function deliveryFromRow(row: DatabaseOrder): DeliveryDetails {
  if (row.delivery_type === "hotel-room") {
    return { type: "hotel-room", guestName: row.customer_name ?? "", phone: row.customer_phone ?? "", floor: row.floor ?? "", room: row.room ?? "", ...(row.customer_notes ? { instructions: row.customer_notes } : {}) };
  }

  if (row.delivery_type === "pool-area") {
    return { type: "pool-area", guestName: row.customer_name ?? "", phone: row.customer_phone ?? "", ...(row.pool_location_details ? { locationDetails: row.pool_location_details } : {}), ...(row.customer_notes ? { instructions: row.customer_notes } : {}) };
  }

  return { type: "pickup", name: row.customer_name ?? "", phone: row.customer_phone ?? "", email: row.customer_email ?? "", ...(row.customer_notes ? { notes: row.customer_notes } : {}) };
}

function orderFromRows(row: DatabaseOrder, items: DatabaseOrderItem[]): RestaurantOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: asIsoString(row.created_at),
    status: row.order_status,
    paymentStatus: row.payment_status,
    items: items.map((item) => ({ productId: item.product_id, name: item.product_name, category: item.category, quantity: item.quantity, unitPriceInCents: item.unit_price_cents, totalInCents: item.line_total_cents })),
    totalInCents: row.total_amount_cents,
    delivery: deliveryFromRow(row),
    ...(row.stripe_checkout_session_id ? { stripeCheckoutSessionId: row.stripe_checkout_session_id } : {}),
    ...(row.stripe_payment_intent_id ? { stripePaymentIntentId: row.stripe_payment_intent_id } : {}),
    processedWebhookEventIds: [],
    ...(row.paid_at ? { paidAt: asIsoString(row.paid_at) } : {}),
  };
}

export async function createPendingOrder(input: OrderInput) {
  const sql = getDatabase();
  const id = randomUUID();
  const orderNumber = `DV-${Date.now()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const details = deliveryFields(input.delivery);

  await sql`
    INSERT INTO orders (
      id, order_number, order_status, payment_status,
      customer_name, customer_phone, customer_email, delivery_type,
      floor, room, pool_location_details, customer_notes, total_amount_cents
    ) VALUES (
      ${id}, ${orderNumber}, 'PENDING_PAYMENT', 'PENDING',
      ${details.customerName}, ${details.customerPhone}, ${details.customerEmail}, ${input.delivery.type},
      ${details.floor}, ${details.room}, ${details.poolLocationDetails}, ${details.customerNotes}, ${input.totalInCents}
    )
  `;

  try {
    await Promise.all(input.items.map((item) => sql`
      INSERT INTO order_items (
        order_id, product_id, product_name, category, quantity, unit_price_cents, line_total_cents
      ) VALUES (
        ${id}, ${item.productId}, ${item.name}, ${item.category}, ${item.quantity}, ${item.unitPriceInCents}, ${item.totalInCents}
      )
    `));
  } catch (error) {
    await sql`DELETE FROM orders WHERE id = ${id}`;
    throw error;
  }

  return { id, orderNumber, createdAt: new Date().toISOString(), status: "PENDING_PAYMENT" as const, paymentStatus: "PENDING" as const, items: input.items, totalInCents: input.totalInCents, delivery: input.delivery, processedWebhookEventIds: [] };
}

export async function getOrder(id: string) {
  const sql = getDatabase();
  const orders = await sql`SELECT * FROM orders WHERE id = ${id}` as DatabaseOrder[];
  const order = orders[0];
  if (!order) return undefined;

  const items = await sql`
    SELECT product_id, product_name, category, quantity, unit_price_cents, line_total_cents
    FROM order_items
    WHERE order_id = ${id}
    ORDER BY id
  ` as DatabaseOrderItem[];

  return orderFromRows(order, items);
}

export async function setCheckoutSession(id: string, stripeCheckoutSessionId: string) {
  const sql = getDatabase();
  await sql`
    UPDATE orders
    SET stripe_checkout_session_id = ${stripeCheckoutSessionId}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function markOrderPaid(id: string, eventId: string, stripeCheckoutSessionId: string, stripePaymentIntentId?: string) {
  const sql = getDatabase();

  // Stripe retries webhooks. Inserting the Stripe event in this query makes
  // repeated deliveries idempotent while the order update stays atomic.
  await sql`
    WITH recorded_event AS (
      INSERT INTO stripe_webhook_events (stripe_event_id, order_id, event_type)
      SELECT ${eventId}, orders.id, 'checkout.session.completed'
      FROM orders
      WHERE orders.id = ${id}
      ON CONFLICT (stripe_event_id) DO NOTHING
      RETURNING order_id
    )
    UPDATE orders
    SET
      order_status = 'PAID',
      payment_status = 'PAID',
      paid_at = COALESCE(paid_at, NOW()),
      updated_at = NOW(),
      stripe_checkout_session_id = ${stripeCheckoutSessionId},
      stripe_payment_intent_id = COALESCE(${stripePaymentIntentId ?? null}, stripe_payment_intent_id)
    WHERE id IN (SELECT order_id FROM recorded_event)
  `;

  return getOrder(id);
}
