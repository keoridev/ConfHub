-- +goose Up
ALTER TABLE sections ADD COLUMN IF NOT EXISTS supervisor TEXT;

-- +goose Down
ALTER TABLE sections DROP COLUMN IF EXISTS supervisor;
