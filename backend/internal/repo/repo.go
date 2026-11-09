package repo

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"confapp/internal/models"
)

// DB wraps a pgx connection pool.
type DB struct {
	Pool *pgxpool.Pool
}

// NewDB creates a new DB with a connection pool.
func NewDB(ctx context.Context, databaseURL string) (*DB, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("connect to db: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return &DB{Pool: pool}, nil
}

// Close shuts down the pool.
func (db *DB) Close() {
	db.Pool.Close()
}

// Ping checks database connectivity.
func (db *DB) Ping(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

// ── Users ────────────────────────────────────

func (db *DB) CreateUser(ctx context.Context, u *models.User) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO users (login, password_hash, full_name, group_name, email, role, is_active, must_change_password, consent_given_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, created_at`,
		u.Login, u.PasswordHash, u.FullName, u.GroupName, u.Email, u.Role, u.IsActive, u.MustChangePassword, u.ConsentGivenAt,
	).Scan(&u.ID, &u.CreatedAt)
}

func (db *DB) GetUserByLogin(ctx context.Context, login string) (*models.User, error) {
	u := &models.User{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, login, password_hash, full_name, group_name, email, role, is_active,
		        must_change_password, token_version, consent_given_at, failed_logins, locked_until, created_at
		 FROM users WHERE login = $1`, login,
	).Scan(&u.ID, &u.Login, &u.PasswordHash, &u.FullName, &u.GroupName, &u.Email,
		&u.Role, &u.IsActive, &u.MustChangePassword, &u.TokenVersion,
		&u.ConsentGivenAt, &u.FailedLogins, &u.LockedUntil, &u.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (db *DB) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	u := &models.User{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, login, password_hash, full_name, group_name, email, role, is_active,
		        must_change_password, token_version, consent_given_at, failed_logins, locked_until, created_at
		 FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Login, &u.PasswordHash, &u.FullName, &u.GroupName, &u.Email,
		&u.Role, &u.IsActive, &u.MustChangePassword, &u.TokenVersion,
		&u.ConsentGivenAt, &u.FailedLogins, &u.LockedUntil, &u.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (db *DB) LoginExists(ctx context.Context, login string) (bool, error) {
	var exists bool
	err := db.Pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE login = $1)`, login,
	).Scan(&exists)
	return exists, err
}

func (db *DB) IncrementFailedLogins(ctx context.Context, userID int64, lockUntil *time.Time) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET failed_logins = failed_logins + 1, locked_until = $2 WHERE id = $1`,
		userID, lockUntil)
	return err
}

func (db *DB) ResetFailedLogins(ctx context.Context, userID int64) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1`, userID)
	return err
}

func (db *DB) UpdatePassword(ctx context.Context, userID int64, hash string, mustChange bool) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET password_hash = $2, must_change_password = $3, token_version = token_version + 1 WHERE id = $1`,
		userID, hash, mustChange)
	return err
}

func (db *DB) SetConsent(ctx context.Context, userID int64, at time.Time) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET consent_given_at = $2 WHERE id = $1`, userID, at)
	return err
}

func (db *DB) UpdateUser(ctx context.Context, id int64, fullName, groupName, role *string, isActive *bool) error {
	setClauses := []string{}
	args := []interface{}{id}
	argIdx := 2

	if fullName != nil {
		setClauses = append(setClauses, fmt.Sprintf("full_name = $%d", argIdx))
		args = append(args, *fullName)
		argIdx++
	}
	if groupName != nil {
		setClauses = append(setClauses, fmt.Sprintf("group_name = $%d", argIdx))
		args = append(args, *groupName)
		argIdx++
	}
	if role != nil {
		setClauses = append(setClauses, fmt.Sprintf("role = $%d", argIdx))
		args = append(args, *role)
		argIdx++
	}
	if isActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *isActive)
		argIdx++
		if !*isActive {
			setClauses = append(setClauses, "token_version = token_version + 1")
		}
	}
	if len(setClauses) == 0 {
		return nil
	}
	query := fmt.Sprintf("UPDATE users SET %s WHERE id = $1", strings.Join(setClauses, ", "))
	_, err := db.Pool.Exec(ctx, query, args...)
	return err
}

func (db *DB) ResetUserPassword(ctx context.Context, userID int64, hash string) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE users SET password_hash = $2, must_change_password = true, token_version = token_version + 1 WHERE id = $1`,
		userID, hash)
	return err
}

func (db *DB) ListUsers(ctx context.Context, role, q *string, isActive *bool) ([]models.User, error) {
	query := `SELECT id, login, full_name, group_name, email, role, is_active, must_change_password, consent_given_at, created_at
	          FROM users WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if role != nil {
		query += fmt.Sprintf(" AND role = $%d", argIdx)
		args = append(args, *role)
		argIdx++
	}
	if isActive != nil {
		query += fmt.Sprintf(" AND is_active = $%d", argIdx)
		args = append(args, *isActive)
		argIdx++
	}
	if q != nil && *q != "" {
		query += fmt.Sprintf(" AND (full_name ILIKE $%d OR login ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+*q+"%")
		argIdx++
	}
	query += " ORDER BY id"

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Login, &u.FullName, &u.GroupName, &u.Email,
			&u.Role, &u.IsActive, &u.MustChangePassword, &u.ConsentGivenAt, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (db *DB) UserExistsByNameAndGroup(ctx context.Context, fullName, groupName string) (bool, error) {
	var exists bool
	err := db.Pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE full_name = $1 AND COALESCE(group_name, '') = $2)`,
		fullName, groupName,
	).Scan(&exists)
	return exists, err
}

// ── Conferences ──────────────────────────────

func (db *DB) CreateConference(ctx context.Context, c *models.Conference) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO conferences (title, starts_at, ends_at, is_current)
		 VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
		c.Title, c.StartsAt, c.EndsAt, c.IsCurrent,
	).Scan(&c.ID, &c.CreatedAt)
}

func (db *DB) GetCurrentConference(ctx context.Context) (*models.Conference, error) {
	c := &models.Conference{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, title, starts_at, ends_at, is_current, schedule, created_at
		 FROM conferences WHERE is_current = true`,
	).Scan(&c.ID, &c.Title, &c.StartsAt, &c.EndsAt, &c.IsCurrent, &c.Schedule, &c.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (db *DB) GetConference(ctx context.Context, id int64) (*models.Conference, error) {
	c := &models.Conference{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, title, starts_at, ends_at, is_current, schedule, created_at
		 FROM conferences WHERE id = $1`, id,
	).Scan(&c.ID, &c.Title, &c.StartsAt, &c.EndsAt, &c.IsCurrent, &c.Schedule, &c.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (db *DB) ListConferences(ctx context.Context) ([]models.Conference, error) {
	rows, err := db.Pool.Query(ctx,
		`SELECT id, title, starts_at, ends_at, is_current, schedule, created_at FROM conferences ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Conference
	for rows.Next() {
		var c models.Conference
		if err := rows.Scan(&c.ID, &c.Title, &c.StartsAt, &c.EndsAt, &c.IsCurrent, &c.Schedule, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (db *DB) UpdateConference(ctx context.Context, c *models.Conference) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE conferences SET title=$2, starts_at=$3, ends_at=$4, is_current=$5 WHERE id=$1`,
		c.ID, c.Title, c.StartsAt, c.EndsAt, c.IsCurrent)
	return err
}

// UpdateConferenceSchedule saves the timetable settings; it reports false when the conference does not exist.
func (db *DB) UpdateConferenceSchedule(ctx context.Context, id int64, s *models.ScheduleSettings) (bool, error) {
	tag, err := db.Pool.Exec(ctx, `UPDATE conferences SET schedule=$2 WHERE id=$1`, id, s)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (db *DB) SetCurrentConference(ctx context.Context, id int64) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `UPDATE conferences SET is_current = false WHERE is_current = true`)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `UPDATE conferences SET is_current = true WHERE id = $1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (db *DB) DeleteConference(ctx context.Context, id int64) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM conferences WHERE id = $1`, id)
	return err
}

// ── Sections ─────────────────────────────────

func (db *DB) CreateSection(ctx context.Context, s *models.Section) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO sections (conference_id, title, sort_order, supervisor) VALUES ($1, $2, $3, $4) RETURNING id`,
		s.ConferenceID, s.Title, s.SortOrder, s.Supervisor,
	).Scan(&s.ID)
}

func (db *DB) ListSections(ctx context.Context, conferenceID int64) ([]models.Section, error) {
	rows, err := db.Pool.Query(ctx,
		`SELECT id, conference_id, title, sort_order, supervisor FROM sections WHERE conference_id = $1 ORDER BY sort_order, id`,
		conferenceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Section
	for rows.Next() {
		var s models.Section
		if err := rows.Scan(&s.ID, &s.ConferenceID, &s.Title, &s.SortOrder, &s.Supervisor); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (db *DB) GetSection(ctx context.Context, id int64) (*models.Section, error) {
	s := &models.Section{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, conference_id, title, sort_order, supervisor FROM sections WHERE id = $1`, id,
	).Scan(&s.ID, &s.ConferenceID, &s.Title, &s.SortOrder, &s.Supervisor)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func (db *DB) UpdateSection(ctx context.Context, s *models.Section) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE sections SET title=$2, sort_order=$3, supervisor=$4 WHERE id=$1`, s.ID, s.Title, s.SortOrder, s.Supervisor)
	return err
}

func (db *DB) DeleteSection(ctx context.Context, id int64) error {
	// Will fail with FK violation if talks reference this section
	_, err := db.Pool.Exec(ctx, `DELETE FROM sections WHERE id = $1`, id)
	return err
}

func (db *DB) SectionHasTalks(ctx context.Context, id int64) (bool, error) {
	var exists bool
	err := db.Pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM talks WHERE section_id = $1)`, id).Scan(&exists)
	return exists, err
}

// ── Rooms ────────────────────────────────────

func (db *DB) CreateRoom(ctx context.Context, r *models.Room) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO rooms (conference_id, name) VALUES ($1, $2) RETURNING id`,
		r.ConferenceID, r.Name,
	).Scan(&r.ID)
}

func (db *DB) ListRooms(ctx context.Context, conferenceID int64) ([]models.Room, error) {
	rows, err := db.Pool.Query(ctx,
		`SELECT id, conference_id, name FROM rooms WHERE conference_id = $1 ORDER BY id`, conferenceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Room
	for rows.Next() {
		var r models.Room
		if err := rows.Scan(&r.ID, &r.ConferenceID, &r.Name); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

func (db *DB) GetRoom(ctx context.Context, id int64) (*models.Room, error) {
	r := &models.Room{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, conference_id, name FROM rooms WHERE id = $1`, id,
	).Scan(&r.ID, &r.ConferenceID, &r.Name)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return r, err
}

func (db *DB) UpdateRoom(ctx context.Context, r *models.Room) error {
	_, err := db.Pool.Exec(ctx, `UPDATE rooms SET name=$2 WHERE id=$1`, r.ID, r.Name)
	return err
}

func (db *DB) DeleteRoom(ctx context.Context, id int64) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM rooms WHERE id = $1`, id)
	return err
}

func (db *DB) RoomHasTalks(ctx context.Context, id int64) (bool, error) {
	var exists bool
	err := db.Pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM talks WHERE room_id = $1)`, id).Scan(&exists)
	return exists, err
}

// ── Talks ────────────────────────────────────

func (db *DB) CreateTalk(ctx context.Context, t *models.Talk) error {
	if t.Tags == nil {
		t.Tags = []string{}
	}
	if t.CoAuthors == nil {
		t.CoAuthors = []models.CoAuthor{}
	}
	if t.Keywords == nil {
		t.Keywords = []string{}
	}
	return db.Pool.QueryRow(ctx,
		`INSERT INTO talks (conference_id, section_id, author_id, title, speaker_name, grade_or_group, supervisor, abstract, tags, co_authors, keywords, author_email, university, status, jury_comment, room_id, start_time, end_time)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
		 RETURNING id, created_at, updated_at`,
		t.ConferenceID, t.SectionID, t.AuthorID, t.Title, t.SpeakerName, t.GradeOrGroup,
		t.Supervisor, t.Abstract, t.Tags, t.CoAuthors, t.Keywords, t.AuthorEmail, t.University,
		t.Status, t.JuryComment, t.RoomID, t.StartTime, t.EndTime,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

func (db *DB) GetTalk(ctx context.Context, id int64) (*models.Talk, error) {
	t := &models.Talk{}
	err := db.Pool.QueryRow(ctx,
		`SELECT t.id, t.conference_id, t.section_id, t.author_id, t.title, t.speaker_name,
		        t.grade_or_group, t.supervisor, t.abstract, t.tags, t.co_authors, t.keywords,
		        t.author_email, t.university, t.status,
		        t.jury_comment, t.reviewed_by, t.reviewed_at,
		        t.room_id, t.start_time, t.end_time, t.ai_attempts,
		        t.created_at, t.updated_at
		 FROM talks t WHERE t.id = $1`, id,
	).Scan(&t.ID, &t.ConferenceID, &t.SectionID, &t.AuthorID, &t.Title, &t.SpeakerName,
		&t.GradeOrGroup, &t.Supervisor, &t.Abstract, &t.Tags, &t.CoAuthors, &t.Keywords,
		&t.AuthorEmail, &t.University, &t.Status,
		&t.JuryComment, &t.ReviewedBy, &t.ReviewedAt,
		&t.RoomID, &t.StartTime, &t.EndTime, &t.AIAttempts,
		&t.CreatedAt, &t.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if t.Tags == nil {
		t.Tags = []string{}
	}
	if t.CoAuthors == nil {
		t.CoAuthors = []models.CoAuthor{}
	}
	if t.Keywords == nil {
		t.Keywords = []string{}
	}
	return t, nil
}

// GetTalkWithJoins returns a talk with section and room joined.
func (db *DB) GetTalkWithJoins(ctx context.Context, id int64) (*models.Talk, error) {
	t, err := db.GetTalk(ctx, id)
	if err != nil || t == nil {
		return t, err
	}
	if t.SectionID != nil {
		t.Section, _ = db.GetSection(ctx, *t.SectionID)
	}
	if t.RoomID != nil {
		t.Room, _ = db.GetRoom(ctx, *t.RoomID)
	}
	t.Document, _ = db.GetDocument(ctx, id)
	t.Presentation, _ = db.GetPresentation(ctx, id)
	t.AIResult, _ = db.GetLatestAIResult(ctx, id)
	return t, nil
}

func (db *DB) CountTalksByAuthorAndConference(ctx context.Context, authorID, conferenceID int64) (int, error) {
	var count int
	err := db.Pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM talks WHERE author_id = $1 AND conference_id = $2`,
		authorID, conferenceID).Scan(&count)
	return count, err
}

func (db *DB) ListTalksByAuthor(ctx context.Context, authorID int64) ([]models.Talk, error) {
	rows, err := db.Pool.Query(ctx,
		`SELECT t.id, t.conference_id, t.section_id, t.author_id, t.title, t.speaker_name,
		        t.grade_or_group, t.supervisor, t.abstract, t.tags, t.co_authors, t.keywords,
		        t.author_email, t.university, t.status,
		        t.jury_comment, t.reviewed_by, t.reviewed_at,
		        t.room_id, t.start_time, t.end_time, t.ai_attempts,
		        t.created_at, t.updated_at
		 FROM talks t WHERE t.author_id = $1 ORDER BY t.created_at DESC`, authorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTalks(rows)
}

// ListTalks returns talks filtered by conference, status, section, search query, and tag.
func (db *DB) ListTalks(ctx context.Context, conferenceID int64, status, sectionID, q, tag *string) ([]models.Talk, error) {
	query := `SELECT t.id, t.conference_id, t.section_id, t.author_id, t.title, t.speaker_name,
	                 t.grade_or_group, t.supervisor, t.abstract, t.tags, t.co_authors, t.keywords,
	                 t.author_email, t.university, t.status,
	                 t.jury_comment, t.reviewed_by, t.reviewed_at,
	                 t.room_id, t.start_time, t.end_time, t.ai_attempts,
	                 t.created_at, t.updated_at
	          FROM talks t WHERE t.conference_id = $1`
	args := []interface{}{conferenceID}
	argIdx := 2

	if status != nil {
		query += fmt.Sprintf(" AND t.status = $%d", argIdx)
		args = append(args, *status)
		argIdx++
	}
	if sectionID != nil {
		query += fmt.Sprintf(" AND t.section_id = $%d", argIdx)
		args = append(args, *sectionID)
		argIdx++
	}
	if tag != nil && *tag != "" {
		query += fmt.Sprintf(" AND ($%d = ANY(t.tags) OR $%d = ANY(t.keywords))", argIdx, argIdx)
		args = append(args, *tag)
		argIdx++
	}
	if q != nil && *q != "" {
		query += fmt.Sprintf(" AND (t.title ILIKE $%d OR t.speaker_name ILIKE $%d OR t.abstract ILIKE $%d OR t.university ILIKE $%d OR t.supervisor ILIKE $%d OR t.grade_or_group ILIKE $%d OR EXISTS (SELECT 1 FROM unnest(t.tags) tg WHERE tg ILIKE $%d) OR EXISTS (SELECT 1 FROM unnest(t.keywords) kw WHERE kw ILIKE $%d) OR EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(t.co_authors) = 'array' THEN t.co_authors ELSE '[]'::jsonb END) ca WHERE ca->>'name' ILIKE $%d OR ca->>'fullName' ILIKE $%d OR ca->>'email' ILIKE $%d OR ca->>'phone' ILIKE $%d OR ca->>'university' ILIKE $%d OR ca->>'group' ILIKE $%d OR ca->>'gradeOrGroup' ILIKE $%d))",
			argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+*q+"%")
		argIdx++
	}
	query += " ORDER BY t.start_time ASC NULLS LAST, t.created_at DESC"

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTalks(rows)
}

func (db *DB) UpdateTalk(ctx context.Context, t *models.Talk) error {
	if t.Tags == nil {
		t.Tags = []string{}
	}
	if t.CoAuthors == nil {
		t.CoAuthors = []models.CoAuthor{}
	}
	if t.Keywords == nil {
		t.Keywords = []string{}
	}
	_, err := db.Pool.Exec(ctx,
		`UPDATE talks SET section_id=$2, title=$3, supervisor=$4, abstract=$5, tags=$6,
		        co_authors=$7, keywords=$8, author_email=$9, university=$10, grade_or_group=$11,
		        status=$12, jury_comment=$13, reviewed_by=$14, reviewed_at=$15,
		        room_id=$16, start_time=$17, end_time=$18, speaker_name=$19, updated_at=NOW()
		 WHERE id=$1`,
		t.ID, t.SectionID, t.Title, t.Supervisor, t.Abstract, t.Tags,
		t.CoAuthors, t.Keywords, t.AuthorEmail, t.University, t.GradeOrGroup,
		t.Status, t.JuryComment, t.ReviewedBy, t.ReviewedAt,
		t.RoomID, t.StartTime, t.EndTime, t.SpeakerName)
	return err
}

func (db *DB) IncrementAIAttempts(ctx context.Context, talkID int64) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE talks SET ai_attempts = ai_attempts + 1 WHERE id = $1`, talkID)
	return err
}

func (db *DB) ResetAIAttempts(ctx context.Context, talkID int64) error {
	_, err := db.Pool.Exec(ctx,
		`UPDATE talks SET ai_attempts = 0 WHERE id = $1`, talkID)
	return err
}

func (db *DB) DeleteTalk(ctx context.Context, id int64) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM talks WHERE id = $1`, id)
	return err
}

func scanTalks(rows pgx.Rows) ([]models.Talk, error) {
	talks := make([]models.Talk, 0)
	for rows.Next() {
		var t models.Talk
		if err := rows.Scan(&t.ID, &t.ConferenceID, &t.SectionID, &t.AuthorID, &t.Title, &t.SpeakerName,
			&t.GradeOrGroup, &t.Supervisor, &t.Abstract, &t.Tags, &t.CoAuthors, &t.Keywords,
			&t.AuthorEmail, &t.University, &t.Status,
			&t.JuryComment, &t.ReviewedBy, &t.ReviewedAt,
			&t.RoomID, &t.StartTime, &t.EndTime, &t.AIAttempts,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		if t.Tags == nil {
			t.Tags = []string{}
		}
		if t.CoAuthors == nil {
			t.CoAuthors = []models.CoAuthor{}
		}
		if t.Keywords == nil {
			t.Keywords = []string{}
		}
		talks = append(talks, t)
	}
	return talks, nil
}

// ── Talk Documents ───────────────────────────

func (db *DB) UpsertDocument(ctx context.Context, d *models.TalkDocument) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO talk_documents (talk_id, original_name, stored_name, mime, size_bytes, extracted_text, has_text)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (talk_id) DO UPDATE SET
		   original_name=EXCLUDED.original_name, stored_name=EXCLUDED.stored_name,
		   mime=EXCLUDED.mime, size_bytes=EXCLUDED.size_bytes,
		   extracted_text=EXCLUDED.extracted_text, has_text=EXCLUDED.has_text,
		   uploaded_at=NOW()
		 RETURNING id, uploaded_at`,
		d.TalkID, d.OriginalName, d.StoredName, d.Mime, d.SizeBytes, d.ExtractedText, d.HasText,
	).Scan(&d.ID, &d.UploadedAt)
}

func (db *DB) GetDocument(ctx context.Context, talkID int64) (*models.TalkDocument, error) {
	d := &models.TalkDocument{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, talk_id, original_name, stored_name, mime, size_bytes, extracted_text, has_text, uploaded_at
		 FROM talk_documents WHERE talk_id = $1`, talkID,
	).Scan(&d.ID, &d.TalkID, &d.OriginalName, &d.StoredName, &d.Mime, &d.SizeBytes,
		&d.ExtractedText, &d.HasText, &d.UploadedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return d, err
}

func (db *DB) GetDocumentStoredName(ctx context.Context, talkID int64) (string, error) {
	var name string
	err := db.Pool.QueryRow(ctx,
		`SELECT stored_name FROM talk_documents WHERE talk_id = $1`, talkID).Scan(&name)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	return name, err
}

// ── Talk Presentations ───────────────────────

func (db *DB) UpsertPresentation(ctx context.Context, d *models.TalkDocument) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO talk_presentations (talk_id, original_name, stored_name, mime, size_bytes, extracted_text, has_text)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (talk_id) DO UPDATE SET
		   original_name=EXCLUDED.original_name, stored_name=EXCLUDED.stored_name,
		   mime=EXCLUDED.mime, size_bytes=EXCLUDED.size_bytes,
		   extracted_text=EXCLUDED.extracted_text, has_text=EXCLUDED.has_text,
		   uploaded_at=NOW()
		 RETURNING id, uploaded_at`,
		d.TalkID, d.OriginalName, d.StoredName, d.Mime, d.SizeBytes, d.ExtractedText, d.HasText,
	).Scan(&d.ID, &d.UploadedAt)
}

func (db *DB) GetPresentation(ctx context.Context, talkID int64) (*models.TalkDocument, error) {
	d := &models.TalkDocument{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, talk_id, original_name, stored_name, mime, size_bytes, extracted_text, has_text, uploaded_at
		 FROM talk_presentations WHERE talk_id = $1`, talkID,
	).Scan(&d.ID, &d.TalkID, &d.OriginalName, &d.StoredName, &d.Mime, &d.SizeBytes,
		&d.ExtractedText, &d.HasText, &d.UploadedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return d, err
}

func (db *DB) GetPresentationStoredName(ctx context.Context, talkID int64) (string, error) {
	var name string
	err := db.Pool.QueryRow(ctx,
		`SELECT stored_name FROM talk_presentations WHERE talk_id = $1`, talkID).Scan(&name)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	return name, err
}

// ── AI Results ───────────────────────────────

func (db *DB) CreateAIResult(ctx context.Context, r *models.AIResult) error {
	return db.Pool.QueryRow(ctx,
		`INSERT INTO ai_results (talk_id, document_id, attempt_no, result, model)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
		r.TalkID, r.DocumentID, r.AttemptNo, r.Result, r.Model,
	).Scan(&r.ID, &r.CreatedAt)
}

func (db *DB) GetLatestAIResult(ctx context.Context, talkID int64) (*models.AIResult, error) {
	r := &models.AIResult{}
	err := db.Pool.QueryRow(ctx,
		`SELECT id, talk_id, document_id, attempt_no, result, model, created_at
		 FROM ai_results WHERE talk_id = $1 ORDER BY created_at DESC LIMIT 1`, talkID,
	).Scan(&r.ID, &r.TalkID, &r.DocumentID, &r.AttemptNo, &r.Result, &r.Model, &r.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	return r, err
}

// ── AI Usage ─────────────────────────────────

func (db *DB) GetAIUsageToday(ctx context.Context, userID int64) (int, error) {
	var count int
	err := db.Pool.QueryRow(ctx,
		`SELECT COALESCE((SELECT count FROM ai_usage WHERE user_id = $1 AND day = CURRENT_DATE), 0)`,
		userID).Scan(&count)
	return count, err
}

func (db *DB) IncrementAIUsage(ctx context.Context, userID int64) error {
	_, err := db.Pool.Exec(ctx,
		`INSERT INTO ai_usage (user_id, day, count) VALUES ($1, CURRENT_DATE, 1)
		 ON CONFLICT (user_id, day) DO UPDATE SET count = ai_usage.count + 1`,
		userID)
	return err
}
