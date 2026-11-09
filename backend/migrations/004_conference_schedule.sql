-- +goose Up
ALTER TABLE conferences ADD COLUMN IF NOT EXISTS schedule JSONB;

-- +goose Down
ALTER TABLE conferences DROP COLUMN IF EXISTS schedule;
