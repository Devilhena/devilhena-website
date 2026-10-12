-- Native Web Push subscriptions and durable, retryable notification outbox.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY,
  staff_user_id UUID NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS push_subscriptions_active_staff_index
  ON push_subscriptions (staff_user_id) WHERE disabled_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ORDER_PAID')),
  payload JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'PENDING' CHECK (state IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_outbox_dispatch_index
  ON notification_outbox (available_at ASC) WHERE state IN ('PENDING', 'PROCESSING');

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notification_outbox(id) ON DELETE CASCADE,
  push_subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('SENT', 'RETRY', 'INVALID', 'FAILED')),
  provider_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_delivery_attempts_notification_index
  ON notification_delivery_attempts (notification_id, created_at DESC);
