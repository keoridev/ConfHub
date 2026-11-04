-- +goose Up
ALTER TABLE talks ADD COLUMN IF NOT EXISTS co_authors TEXT[] DEFAULT '{}';
ALTER TABLE talks ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE talks ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE talks ADD COLUMN IF NOT EXISTS university TEXT;

CREATE INDEX IF NOT EXISTS idx_talks_keywords ON talks USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_talks_co_authors ON talks USING GIN (co_authors);

CREATE TABLE IF NOT EXISTS talk_presentations (
    id             BIGSERIAL PRIMARY KEY,
    talk_id        BIGINT UNIQUE NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
    original_name  TEXT,
    stored_name    TEXT,
    mime           TEXT,
    size_bytes     BIGINT,
    extracted_text TEXT,
    has_text       BOOLEAN,
    uploaded_at    TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS talk_presentations;
DROP INDEX IF EXISTS idx_talks_co_authors;
DROP INDEX IF EXISTS idx_talks_keywords;
ALTER TABLE talks DROP COLUMN IF EXISTS university;
ALTER TABLE talks DROP COLUMN IF EXISTS author_email;
ALTER TABLE talks DROP COLUMN IF EXISTS keywords;
ALTER TABLE talks DROP COLUMN IF EXISTS co_authors; 
