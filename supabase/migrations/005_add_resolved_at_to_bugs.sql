-- Migration: Add resolved_at timestamp to bugs table
-- This column tracks when a bug was marked as resolved,
-- enabling automatic closure after a configurable period (default: 7 days).

ALTER TABLE bugs ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;

-- Index to efficiently query bugs eligible for auto-closure
CREATE INDEX IF NOT EXISTS idx_bugs_resolved_at
  ON bugs(resolved_at)
  WHERE status = 'resolved' AND resolved_at IS NOT NULL;

-- Backfill: for existing resolved/closed bugs, set resolved_at = updated_at as best estimate
UPDATE bugs
SET resolved_at = updated_at
WHERE status IN ('resolved', 'closed') AND resolved_at IS NULL;
