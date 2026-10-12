-- Additive operational data for staff order handling. Do not run on production
-- until it has first been tested against a separate Neon branch.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('TEST', 'LIVE'));

CREATE INDEX IF NOT EXISTS orders_active_paid_index
  ON orders (created_at ASC)
  WHERE payment_status = 'PAID'
    AND restaurant_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY')
    AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS orders_archived_at_index ON orders (archived_at DESC) WHERE archived_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_staff_user_id UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ACCEPTED', 'COMPLETED', 'CANCELLED', 'ARCHIVED', 'ACKNOWLEDGED')),
  from_status TEXT,
  to_status TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_activity_order_id_index ON order_activity (order_id, created_at DESC);
