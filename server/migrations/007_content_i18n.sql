-- Migration: bilingual analysis content (English + Myanmar)

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS content_i18n JSONB NOT NULL DEFAULT '{"en":{},"my":{}}'::jsonb;
