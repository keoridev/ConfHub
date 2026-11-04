-- Only create initial conference content when there is no conference at all.
-- Existing installations are left untouched, including a deliberately disabled conference.
DO $$
DECLARE
    conference_id bigint;
BEGIN
    IF EXISTS (SELECT 1 FROM conferences) THEN
        RETURN;
    END IF;
    INSERT INTO conferences (title, is_current)
    VALUES ('Студенческая научно-практическая конференция COMTEHNO 2026', true)
    RETURNING id INTO conference_id;

    INSERT INTO sections (conference_id, title, sort_order)
    SELECT conference_id, title, position::int
    FROM unnest(ARRAY[
        'Искусственный интеллект и машинное обучение в устойчивом развитии',
        'Традиции и инновации в архитектурном и дизайнерском решениях',
        'Динамика и исследование сейсмостойкости сооружений',
        'Энергоэффективные композиционные материалы для зеленого строительства',
        'Управление инновациями в секторах экономики (промышленность, строительство, транспорт, электроэнергетика, агропромышленный комплекс)',
        'Энергосберегающие и экологически чистые производства и транспорт',
        'Правовые и социально-экономические аспекты устойчивого развития',
        'История развития, современное состояние и перспективы совершенствования системы учета и экономического развития',
        'Цифровизация, качество и устойчивость в системе образования',
        'Современные стратегии маркетинговых исследований и электронной коммерции',
        'Вызовы и возможности для специалистов будущего: инновации, практики и перспективы',
        'Язык и мышление: психологические и лингвистические аспекты'
    ]) WITH ORDINALITY AS titles(title, position);

    INSERT INTO rooms (conference_id, name)
    SELECT conference_id, name FROM unnest(ARRAY['Ауд. 101', 'Ауд. 204', 'Ауд. 305', 'Конференц-зал']) AS names(name);
END $$;
