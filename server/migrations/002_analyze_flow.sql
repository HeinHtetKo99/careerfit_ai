-- Migration: CV + job description analyze flow (no job catalog)

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS job_description TEXT,
  ADD COLUMN IF NOT EXISTS matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS improvements JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE matches
  ALTER COLUMN job_id DROP NOT NULL;

-- Optional cleanup for legacy installs (safe if column already removed)
ALTER TABLE matches DROP COLUMN IF EXISTS job_id;
DROP TABLE IF EXISTS jobs;
