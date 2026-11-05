-- +goose Up
ALTER TABLE sections ADD COLUMN IF NOT EXISTS supervisor TEXT;

UPDATE sections SET supervisor = 'Жамалова Венера Жумашбековна' WHERE title ILIKE '%интеллект%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Кожобаева Салтанат Толонбаевна' WHERE title ILIKE '%архитектур%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Асаналиева Жылдыз Жолдошбековна' WHERE title ILIKE '%сейсмостойк%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Матыева Акбермет Карыбековна' WHERE title ILIKE '%композицион%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Биримкулова Кыял Дуйшенбековна' WHERE title ILIKE '%Управление инновациями%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Садыков Максат Амангелдиевич' WHERE title ILIKE '%Энергосберегающие%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Биймырсаева Эркегул Мундусбековна' WHERE title ILIKE '%системы учета%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Бостонова Парида Зиябековна' WHERE title ILIKE '%системе образования%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Бусурманкулова Уран Нурдиновна' WHERE title ILIKE '%стратегического управления%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Биримкулова Кыял Дуйшенбековна' WHERE title ILIKE '%Правовые%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Рыспаева Чолпон Курманбековна' WHERE title ILIKE '%Язык и мышление%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Жумаматова Гульмира Каимовна' WHERE title ILIKE '%креативной индустрии%' AND (supervisor IS NULL OR supervisor = '');
UPDATE sections SET supervisor = 'Оморов Нурзатбек Абдишарипович' WHERE title ILIKE '%специалистов будущего%' AND (supervisor IS NULL OR supervisor = '');

-- +goose Down
ALTER TABLE sections DROP COLUMN IF EXISTS supervisor;
