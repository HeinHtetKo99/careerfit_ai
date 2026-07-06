-- Migration: store analysis output language per match

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) NOT NULL DEFAULT 'en';
