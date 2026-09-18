-- Durable shared fixed-window rate limiting for Vercel Functions.
-- Keys are HMAC-derived in application code; no raw IP address, email, password,
-- or request body is stored in this table.

CREATE TABLE IF NOT EXISTS rate_limit_windows (
  rate_limit_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (rate_limit_key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limit_windows_expires_at_index
  ON rate_limit_windows (expires_at);
