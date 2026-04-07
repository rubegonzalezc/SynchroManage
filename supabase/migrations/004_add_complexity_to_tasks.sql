-- Migration 004: Add complexity column to tasks table
-- Complexity: integer 1-10, or NULL to represent "?" (unknown)
-- Applied manually via Supabase SQL Editor

ALTER TABLE public.tasks
  ADD COLUMN complexity SMALLINT CHECK (complexity IS NULL OR (complexity >= 1 AND complexity <= 10));
