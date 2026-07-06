-- Migration: store original uploaded filename for display

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
