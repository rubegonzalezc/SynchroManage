Pero -- Migration: Create password_reset_codes table
-- This table stores verification codes for the password reset flow.
-- Codes are 6-digit numeric strings with a 15-minute expiration.

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up codes by user (e.g., invalidating previous codes)
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id
  ON password_reset_codes(user_id);

-- Composite index for the verification lookup query (user + code + used status)
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_lookup
  ON password_reset_codes(user_id, code, used);

-- Enable Row Level Security
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Only service_role can access this table (used exclusively from API routes via supabaseAdmin)
CREATE POLICY "Service role full access on password_reset_codes"
  ON password_reset_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
