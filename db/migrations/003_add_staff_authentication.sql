-- Run after 002_add_staff_order_management.sql.
-- This creates individual staff accounts without changing any existing order data.

CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
  account_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (account_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  disabled_at TIMESTAMPTZ,
  disabled_by UUID REFERENCES staff_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS staff_users_status_created_at_index ON staff_users (account_status, created_at DESC);
CREATE INDEX IF NOT EXISTS staff_users_role_status_index ON staff_users (role, account_status);
