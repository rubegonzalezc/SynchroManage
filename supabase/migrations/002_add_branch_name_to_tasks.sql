-- Migration: Add branch_name column to tasks table
-- Applied manually via Supabase SQL Editor

ALTER TABLE public.tasks ADD COLUMN branch_name TEXT;
