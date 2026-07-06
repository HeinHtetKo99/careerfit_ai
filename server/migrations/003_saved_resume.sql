-- Migration: one primary (saved) resume per user

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- Mark each user's most recent resume as primary (legacy data)
UPDATE resumes r
SET is_primary = true
FROM (
  SELECT DISTINCT ON (user_id) id
  FROM resumes
  ORDER BY user_id, created_at DESC
) latest
WHERE r.id = latest.id
  AND NOT EXISTS (
    SELECT 1 FROM resumes r2 WHERE r2.user_id = r.user_id AND r2.is_primary = true
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_one_primary_per_user
  ON resumes (user_id)
  WHERE is_primary = true;
