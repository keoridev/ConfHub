-- +goose Up
-- Cover of the partner round table, as in its official program document.
-- Only fills a section that has no cover yet, so manual edits are never overwritten.
UPDATE sections
SET print_cover = jsonb_build_object(
    'organization', 'РОССИЙСКО-КЫРГЫЗСКИЙ ИНСТИТУТ АВТОМАТИЗАЦИИ УПРАВЛЕНИЯ БИЗНЕСА',
    'heading', E'МЕЖДУНАРОДНЫЙ НАУЧНЫЙ КРУГЛЫЙ СТОЛ\n«БУХГАЛТЕРСКИЙ УЧЁТ И АУДИТ В УСЛОВИЯХ ЦИФРОВОЙ ТРАНСФОРМАЦИИ ЭКОНОМИКИ: МЕЖДУНАРОДНЫЙ ОПЫТ, СОВРЕМЕННЫЕ ВЫЗОВЫ И ПЕРСПЕКТИВЫ РАЗВИТИЯ»',
    'dedication', 'ПОСВЯЩЁННЫЙ ДНЮ НАУКИ.',
    'details', E'Дата проведения: 12.11.2026\nВремя проведения: 10:00\nМесто проведения: НИБ МУИТ (4 этаж)\nФормат проведения: очный и дистанционный (онлайн)'
)
WHERE print_cover IS NULL
  AND (title ILIKE '%круглый стол%' OR title ILIKE '%Круглый стол%')
  AND (title ILIKE '%бухгалтер%' OR title ILIKE '%Бухгалтер%');

-- +goose Down
SELECT 1;
