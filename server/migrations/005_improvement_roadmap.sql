-- Migration: AI improvement roadmap per match analysis

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS roadmap JSONB NOT NULL DEFAULT '{"goal":"","phases":[]}'::jsonb;
