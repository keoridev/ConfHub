-- +goose Up
-- Конвертируем co_authors из TEXT[] в JSONB (массив объектов)
CREATE OR REPLACE FUNCTION text_array_to_coauthors(arr text[])
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN arr IS NULL OR cardinality(arr) = 0 THEN '[]'::jsonb
        ELSE (
            SELECT jsonb_agg(jsonb_build_object('name', elem))
            FROM unnest(arr) elem
        )
    END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'talks'
          AND column_name = 'co_authors'
          AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE talks
            ALTER COLUMN co_authors DROP DEFAULT,
            ALTER COLUMN co_authors TYPE JSONB
            USING text_array_to_coauthors(co_authors),
            ALTER COLUMN co_authors SET DEFAULT '[]'::jsonb;
    ELSE
        ALTER TABLE talks ALTER COLUMN co_authors SET DEFAULT '[]'::jsonb;
    END IF;
END $$;

DROP FUNCTION IF EXISTS text_array_to_coauthors(text[]);

-- Пересоздаём индекс для JSONB
DROP INDEX IF EXISTS idx_talks_co_authors;
CREATE INDEX IF NOT EXISTS idx_talks_co_authors ON talks USING GIN (co_authors);

-- +goose Down
CREATE OR REPLACE FUNCTION coauthors_to_text_array(j jsonb)
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN j IS NULL OR jsonb_typeof(j) != 'array' OR jsonb_array_length(j) = 0 THEN '{}'::text[]
        ELSE ARRAY(
            SELECT elem->>'name'
            FROM jsonb_array_elements(j) elem
        )
    END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'talks'
          AND column_name = 'co_authors'
          AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE talks
            ALTER COLUMN co_authors DROP DEFAULT,
            ALTER COLUMN co_authors TYPE TEXT[]
            USING coauthors_to_text_array(co_authors),
            ALTER COLUMN co_authors SET DEFAULT '{}'::text[];
    END IF;
END $$;

DROP FUNCTION IF EXISTS coauthors_to_text_array(jsonb);

DROP INDEX IF EXISTS idx_talks_co_authors;
CREATE INDEX IF NOT EXISTS idx_talks_co_authors ON talks USING GIN (co_authors);
