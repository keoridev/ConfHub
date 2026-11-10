-- +goose Up
-- Position / academic title for non-student participants (teachers, associate professors, ...)
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS position;
