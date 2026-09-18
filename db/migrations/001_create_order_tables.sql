-- Run this once in the Neon SQL Editor for the production database.
-- Amounts are stored as integer euro cents to avoid rounding errors.

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  order_status TEXT NOT NULL CHECK (order_status IN ('PENDING_PAYMENT', 'PAID')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('PENDING', 'PAID')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('hotel-room', 'pool-area', 'pickup')),
  floor TEXT,
  room TEXT,
  pool_location_details TEXT,
  customer_notes TEXT,
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents >= 0),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS orders_created_at_index ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_status_index ON orders (payment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_index ON order_items (order_id);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_order_id_index ON stripe_webhook_events (order_id);
