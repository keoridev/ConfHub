-- +goose Up
ALTER TABLE sections ADD COLUMN IF NOT EXISTS print_cover JSONB;

-- +goose Down
ALTER TABLE sections DROP COLUMN IF EXISTS print_cover;
