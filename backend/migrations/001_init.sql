-- +goose Up
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── Users ────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    login         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    group_name    TEXT,
    email         TEXT,
    role          TEXT NOT NULL CHECK (role IN ('student', 'jury', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INT NOT NULL DEFAULT 0,
    consent_given_at TIMESTAMPTZ,
    failed_logins INT NOT NULL DEFAULT 0,
    locked_until  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Conferences ──────────────────────────────
CREATE TABLE conferences (
    id         BIGSERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    starts_at  TIMESTAMPTZ,
    ends_at    TIMESTAMPTZ,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one conference can be current at a time
CREATE UNIQUE INDEX idx_conferences_current ON conferences (is_current) WHERE is_current;

-- ── Sections ─────────────────────────────────
CREATE TABLE sections (
    id            BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id),
    title         TEXT NOT NULL,
    sort_order    INT DEFAULT 0
);

-- ── Rooms ────────────────────────────────────
CREATE TABLE rooms (
    id            BIGSERIAL PRIMARY KEY,
    conference_id BIGINT NOT NULL REFERENCES conferences(id),
    name          TEXT NOT NULL
);

-- ── Talks ────────────────────────────────────
CREATE TABLE talks (
    id              BIGSERIAL PRIMARY KEY,
    conference_id   BIGINT NOT NULL REFERENCES conferences(id),
    section_id      BIGINT REFERENCES sections(id),
    author_id       BIGINT NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    speaker_name    TEXT NOT NULL,
    grade_or_group  TEXT,
    supervisor      TEXT,
    abstract        TEXT NOT NULL,
    tags            TEXT[] DEFAULT '{}',
    co_authors      TEXT[] DEFAULT '{}',
    keywords        TEXT[] DEFAULT '{}',
    author_email    TEXT,
    university      TEXT,
    status          TEXT NOT NULL DEFAULT 'pending_review'
                    CHECK (status IN ('pending_review', 'approved', 'rejected', 'needs_revision')),
    jury_comment    TEXT,
    reviewed_by     BIGINT REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    room_id         BIGINT REFERENCES rooms(id),
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    ai_attempts     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CHECK (end_time IS NULL OR end_time > start_time),
    CHECK (status <> 'approved' OR (room_id IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL)),

    EXCLUDE USING gist (
        room_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'approved')
);

CREATE INDEX idx_talks_conference_status_time ON talks (conference_id, status, start_time);
CREATE INDEX idx_talks_section ON talks (section_id);
CREATE INDEX idx_talks_author ON talks (author_id);
CREATE INDEX idx_talks_tags ON talks USING GIN (tags);
CREATE INDEX idx_talks_keywords ON talks USING GIN (keywords);
CREATE INDEX idx_talks_co_authors ON talks USING GIN (co_authors);

-- ── Talk documents ───────────────────────────
CREATE TABLE talk_documents (
    id             BIGSERIAL PRIMARY KEY,
    talk_id        BIGINT UNIQUE NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
    original_name  TEXT,
    stored_name    TEXT,
    mime           TEXT,
    size_bytes     BIGINT,
    extracted_text TEXT,
    has_text       BOOLEAN,
    uploaded_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Talk presentations ───────────────────────
CREATE TABLE talk_presentations (
    id             BIGSERIAL PRIMARY KEY,
    talk_id        BIGINT UNIQUE NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
    original_name  TEXT,
    stored_name    TEXT,
    mime           TEXT,
    size_bytes     BIGINT,
    extracted_text TEXT,
    has_text       BOOLEAN,
    uploaded_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI results ───────────────────────────────
CREATE TABLE ai_results (
    id          BIGSERIAL PRIMARY KEY,
    talk_id     BIGINT NOT NULL REFERENCES talks(id) ON DELETE CASCADE,
    document_id BIGINT REFERENCES talk_documents(id) ON DELETE SET NULL,
    attempt_no  INT,
    result      JSONB NOT NULL,
    model       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI usage (daily per-user counter) ────────
CREATE TABLE ai_usage (
    user_id BIGINT REFERENCES users(id),
    day     DATE,
    count   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
);

-- +goose Down
DROP TABLE IF EXISTS ai_usage;
DROP TABLE IF EXISTS ai_results;
DROP TABLE IF EXISTS talk_presentations;
DROP TABLE IF EXISTS talk_documents;
DROP TABLE IF EXISTS talks;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS users;
DROP EXTENSION IF EXISTS btree_gist;
