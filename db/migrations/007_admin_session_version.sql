-- Allows an administrative password reset to invalidate existing signed sessions.

ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1 CHECK (session_version > 0);
