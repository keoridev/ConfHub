-- +goose Up
ALTER TABLE talks ADD COLUMN IF NOT EXISTS is_keynote BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_talks_keynote ON talks (is_keynote) WHERE is_keynote;

-- +goose Down
DROP INDEX IF EXISTS idx_talks_keynote;
ALTER TABLE talks DROP COLUMN IF EXISTS is_keynote;
