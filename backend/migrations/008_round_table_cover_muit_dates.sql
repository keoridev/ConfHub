-- +goose Up
-- Round table cover: МУИТ above the partner institute, dates 12–18 November.
-- Applies only while the cover still has the header written by migration 007
-- (i.e. nobody has edited it by hand).
UPDATE sections
SET print_cover = print_cover || jsonb_build_object(
    'organization', E'МЕЖДУНАРОДНЫЙ УНИВЕРСИТЕТ ИННОВАЦИОННЫХ ТЕХНОЛОГИЙ (МУИТ)\nРОССИЙСКО-КЫРГЫЗСКИЙ ИНСТИТУТ АВТОМАТИЗАЦИИ УПРАВЛЕНИЯ БИЗНЕСА',
    'details', E'Дата проведения: 12–18 ноября 2026 г.\nВремя проведения: 10:00\nМесто проведения: НИБ МУИТ (4 этаж)\nФормат проведения: очный и дистанционный (онлайн)'
)
WHERE print_cover->>'organization' = 'РОССИЙСКО-КЫРГЫЗСКИЙ ИНСТИТУТ АВТОМАТИЗАЦИИ УПРАВЛЕНИЯ БИЗНЕСА'
  AND (title ILIKE '%круглый стол%' OR title ILIKE '%Круглый стол%');

-- +goose Down
SELECT 1;
