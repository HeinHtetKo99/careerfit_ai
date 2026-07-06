-- AI Resume Matcher — PostgreSQL schema

CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resumes (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  file_url          TEXT,
  file_name         VARCHAR(255),
  raw_text          TEXT,
  parsed_skills     JSONB NOT NULL DEFAULT '[]'::jsonb,
  parsed_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
  id               BIGSERIAL PRIMARY KEY,
  resume_id        BIGINT NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  job_title        VARCHAR(255),
  job_description  TEXT,
  match_score      DECIMAL(5, 2) NOT NULL,
  matched_skills   JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills   JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvements     JSONB NOT NULL DEFAULT '[]'::jsonb,
  roadmap          JSONB NOT NULL DEFAULT '{"goal":"","phases":[]}'::jsonb,
  language         VARCHAR(2) NOT NULL DEFAULT 'en',
  content_i18n     JSONB NOT NULL DEFAULT '{"en":{},"my":{}}'::jsonb,
  ai_feedback      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes (user_id);
CREATE UNIQUE INDEX idx_resumes_one_primary_per_user ON resumes (user_id) WHERE is_primary = true;
CREATE INDEX idx_matches_resume_id ON matches (resume_id);
CREATE TRIGGER trg_users_set_created_at
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE PROCEDURE set_created_at();

CREATE TRIGGER trg_resumes_set_created_at
  BEFORE INSERT ON resumes
  FOR EACH ROW
  EXECUTE PROCEDURE set_created_at();

CREATE TRIGGER trg_matches_set_created_at
  BEFORE INSERT ON matches
  FOR EACH ROW
  EXECUTE PROCEDURE set_created_at();
