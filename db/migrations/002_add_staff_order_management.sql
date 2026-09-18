-- Safe additive migration for the staff order dashboard.
-- Existing orders remain intact and begin in the NEW restaurant workflow state.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS restaurant_status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (restaurant_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED')),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orders_restaurant_status_created_at_index
  ON orders (restaurant_status, created_at ASC);

CREATE INDEX IF NOT EXISTS orders_paid_at_index
  ON orders (paid_at DESC)
  WHERE payment_status = 'PAID';
