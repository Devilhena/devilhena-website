-- Durable, configurable email notifications for Stripe-verified paid orders.
-- Apply only after migrations 001-007. This migration is additive and does not
-- alter existing orders or send messages for historical orders.

CREATE TABLE IF NOT EXISTS email_notification_groups (
  recipient_group TEXT PRIMARY KEY CHECK (recipient_group IN ('MANAGEMENT', 'KITCHEN', 'BAR')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO email_notification_groups (recipient_group, enabled)
VALUES ('MANAGEMENT', TRUE), ('KITCHEN', TRUE), ('BAR', TRUE)
ON CONFLICT (recipient_group) DO NOTHING;

CREATE TABLE IF NOT EXISTS email_notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_group TEXT NOT NULL CHECK (recipient_group IN ('MANAGEMENT', 'KITCHEN', 'BAR')),
  email TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_notification_recipients_group_email_key
  ON email_notification_recipients (recipient_group, lower(email));

CREATE INDEX IF NOT EXISTS email_notification_recipients_enabled_index
  ON email_notification_recipients (recipient_group)
  WHERE enabled = TRUE;

CREATE TABLE IF NOT EXISTS order_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  recipient_group TEXT NOT NULL CHECK (recipient_group IN ('MANAGEMENT', 'KITCHEN', 'BAR')),
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  resend_email_id TEXT,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, recipient_group, recipient_email)
);

CREATE INDEX IF NOT EXISTS order_email_notifications_dispatch_index
  ON order_email_notifications (available_at ASC)
  WHERE status IN ('PENDING', 'FAILED', 'SENDING');

CREATE TABLE IF NOT EXISTS order_email_delivery_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES order_email_notifications(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('SENT', 'RETRY', 'FAILED')),
  provider_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_email_delivery_attempts_notification_index
  ON order_email_delivery_attempts (notification_id, created_at DESC);

-- Initial recipients requested for the restaurant. These can be managed later
-- from the authenticated admin settings page without another deployment.
INSERT INTO email_notification_recipients (recipient_group, email)
VALUES
  ('MANAGEMENT', 'Sagarxyerii21@gmail.com'),
  ('MANAGEMENT', 'Devilhena7@gmail.com'),
  ('MANAGEMENT', 'ocristina72@hotmail.com'),
  ('KITCHEN', 'mrthapasagar@gmail.com')
ON CONFLICT (recipient_group, lower(email)) DO NOTHING;
