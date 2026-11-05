package models

import (
	"encoding/json"
	"time"
)

// ── User ─────────────────────────────────────

type User struct {
	ID                 int64      `json:"id"`
	Login              string     `json:"login"`
	PasswordHash       string     `json:"-"`
	FullName           string     `json:"fullName"`
	GroupName          *string    `json:"groupName,omitempty"`
	Email              *string    `json:"email,omitempty"`
	Role               string     `json:"role"`
	IsActive           bool       `json:"isActive"`
	MustChangePassword bool       `json:"mustChangePassword"`
	TokenVersion       int        `json:"tokenVersion,omitempty"`
	ConsentGivenAt     *time.Time `json:"consentGivenAt,omitempty"`
	FailedLogins       int        `json:"-"`
	LockedUntil        *time.Time `json:"-"`
	CreatedAt          time.Time  `json:"createdAt"`
}

// UserPublic is the safe representation returned in API responses.
type UserPublic struct {
	ID                 int64   `json:"id"`
	Login              string  `json:"login"`
	FullName           string  `json:"fullName"`
	GroupName          *string `json:"groupName,omitempty"`
	Role               string  `json:"role"`
	MustChangePassword bool    `json:"mustChangePassword"`
	ConsentRequired    bool    `json:"consentRequired,omitempty"`
}

// ToPublic converts a User to its public representation.
func (u *User) ToPublic() UserPublic {
	consentRequired := u.Role == "student" && u.ConsentGivenAt == nil
	return UserPublic{
		ID:                 u.ID,
		Login:              u.Login,
		FullName:           u.FullName,
		GroupName:          u.GroupName,
		Role:               u.Role,
		MustChangePassword: u.MustChangePassword,
		ConsentRequired:    consentRequired,
	}
}

// ── Conference ───────────────────────────────

type Conference struct {
	ID        int64      `json:"id"`
	Title     string     `json:"title"`
	StartsAt  *time.Time `json:"startsAt,omitempty"`
	EndsAt    *time.Time `json:"endsAt,omitempty"`
	IsCurrent bool       `json:"isCurrent"`
	CreatedAt time.Time  `json:"createdAt"`
}

// ── Section ──────────────────────────────────

type Section struct {
	ID           int64   `json:"id"`
	ConferenceID int64   `json:"conferenceId"`
	Title        string  `json:"title"`
	SortOrder    int     `json:"sortOrder"`
	Supervisor   *string `json:"supervisor,omitempty"`
}

// ── Room ─────────────────────────────────────

type Room struct {
	ID           int64  `json:"id"`
	ConferenceID int64  `json:"conferenceId"`
	Name         string `json:"name"`
}

// ── CoAuthor ────────────────────────────────

// CoAuthor содержит контактные данные соавтора доклада.
type CoAuthor struct {
	Name         string  `json:"name"`
	FullName     string  `json:"fullName,omitempty"`
	Email        *string `json:"email,omitempty"`
	Phone        *string `json:"phone,omitempty"`
	University   *string `json:"university,omitempty"`
	Group        *string `json:"group,omitempty"`
	GradeOrGroup *string `json:"gradeOrGroup,omitempty"`
}

// UnmarshalJSON supports both string ("Иванов А.А.") and object formats,
// as well as "fullName" for "name" and "gradeOrGroup" for "group".
func (c *CoAuthor) UnmarshalJSON(data []byte) error {
	var nameStr string
	if err := json.Unmarshal(data, &nameStr); err == nil {
		c.Name = nameStr
		c.FullName = nameStr
		return nil
	}

	type Alias CoAuthor
	aux := &struct {
		FullName     *string `json:"fullName"`
		GradeOrGroup *string `json:"gradeOrGroup"`
		*Alias
	}{
		Alias: (*Alias)(c),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	if c.Name == "" && aux.FullName != nil {
		c.Name = *aux.FullName
	}
	if c.FullName == "" && c.Name != "" {
		c.FullName = c.Name
	}
	if c.Group == nil && aux.GradeOrGroup != nil {
		c.Group = aux.GradeOrGroup
	}
	if c.GradeOrGroup == nil && c.Group != nil {
		c.GradeOrGroup = c.Group
	}
	return nil
}

// ── Talk ─────────────────────────────────────

type Talk struct {
	ID            int64      `json:"id"`
	ConferenceID  int64      `json:"conferenceId"`
	SectionID     *int64     `json:"sectionId,omitempty"`
	AuthorID      int64      `json:"authorId,omitempty"`
	Title         string     `json:"title"`
	SpeakerName   string     `json:"speakerName"`
	GradeOrGroup  *string    `json:"gradeOrGroup,omitempty"`
	Supervisor    *string    `json:"supervisor,omitempty"`
	Abstract      string     `json:"abstract"`
	Tags          []string   `json:"tags"`
	CoAuthors     []CoAuthor `json:"coAuthors"`
	Keywords      []string   `json:"keywords"`
	AuthorEmail   *string    `json:"authorEmail,omitempty"`
	University    *string    `json:"university,omitempty"`
	Status        string     `json:"status"`
	JuryComment   *string    `json:"juryComment,omitempty"`
	ReviewedBy    *int64     `json:"reviewedBy,omitempty"`
	ReviewedAt    *time.Time `json:"reviewedAt,omitempty"`
	RoomID        *int64     `json:"roomId,omitempty"`
	StartTime     *time.Time `json:"startTime,omitempty"`
	EndTime       *time.Time `json:"endTime,omitempty"`
	AIAttempts    int        `json:"aiAttempts"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`

	// Joined fields (not always present)
	Section      *Section      `json:"section,omitempty"`
	Room         *Room         `json:"room,omitempty"`
	Document     *TalkDocument `json:"document,omitempty"`
	Presentation *TalkDocument `json:"presentation,omitempty"`
	AIResult     *AIResult     `json:"aiResult,omitempty"`
}

// TalkPublic strips internal fields for guest/public view.
type TalkPublic struct {
	ID           int64      `json:"id"`
	ConferenceID int64      `json:"conferenceId"`
	Title        string     `json:"title"`
	SpeakerName  string     `json:"speakerName"`
	GradeOrGroup *string    `json:"gradeOrGroup,omitempty"`
	Supervisor   *string    `json:"supervisor,omitempty"`
	Section      *Section   `json:"section,omitempty"`
	Abstract     string     `json:"abstract"`
	Tags         []string   `json:"tags"`
	CoAuthors    []CoAuthor `json:"coAuthors"`
	Keywords     []string   `json:"keywords"`
	AuthorEmail  *string    `json:"authorEmail,omitempty"`
	University   *string    `json:"university,omitempty"`
	Status       string     `json:"status"`
	Room         *Room      `json:"room,omitempty"`
	StartTime    *time.Time `json:"startTime,omitempty"`
	EndTime      *time.Time `json:"endTime,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// ToPublic strips internal fields.
func (t *Talk) ToPublic() TalkPublic {
	return TalkPublic{
		ID:           t.ID,
		ConferenceID: t.ConferenceID,
		Title:        t.Title,
		SpeakerName:  t.SpeakerName,
		GradeOrGroup: t.GradeOrGroup,
		Supervisor:   t.Supervisor,
		Section:      t.Section,
		Abstract:     t.Abstract,
		Tags:         t.Tags,
		CoAuthors:    t.CoAuthors,
		Keywords:     t.Keywords,
		AuthorEmail:  t.AuthorEmail,
		University:   t.University,
		Status:       t.Status,
		Room:         t.Room,
		StartTime:    t.StartTime,
		EndTime:      t.EndTime,
		CreatedAt:    t.CreatedAt,
	}
}

// ── TalkDocument ─────────────────────────────

type TalkDocument struct {
	ID            int64     `json:"id"`
	TalkID        int64     `json:"talkId"`
	OriginalName  string    `json:"originalName"`
	StoredName    string    `json:"-"`
	Mime          string    `json:"mime"`
	SizeBytes     int64     `json:"sizeBytes"`
	ExtractedText *string   `json:"-"`
	HasText       *bool     `json:"hasText"`
	UploadedAt    time.Time `json:"uploadedAt"`
}

// ── AIResult ─────────────────────────────────

type AIResult struct {
	ID         int64            `json:"id"`
	TalkID     int64            `json:"talkId"`
	DocumentID *int64           `json:"documentId,omitempty"`
	AttemptNo  int              `json:"attemptNo"`
	Result     AIResultData     `json:"result"`
	Model      string           `json:"model"`
	CreatedAt  time.Time        `json:"createdAt"`
}

type AIResultData struct {
	DocumentChecked    bool              `json:"documentChecked"`
	DocumentUnreadable bool              `json:"documentUnreadable"`
	SectionFit         *AIScore          `json:"sectionFit"`
	AnnotationMatch    *AIScore          `json:"annotationMatch"`
	Issues             []AIIssue         `json:"issues"`
	Suggestions        []string          `json:"suggestions"`
	OverallVerdict     string            `json:"overallVerdict"`
	CreatedAt          time.Time         `json:"createdAt"`
}

type AIScore struct {
	Score   int    `json:"score"`
	Verdict string `json:"verdict"`
	Comment string `json:"comment"`
}

type AIIssue struct {
	Type        string `json:"type"`
	Severity    string `json:"severity"`
	Description string `json:"description"`
}

// CalculateOverallVerdict computes the verdict from scores and issues.
// This is done server-side, not by the AI model.
func CalculateOverallVerdict(data *AIResultData) string {
	hasHighIssue := false
	hasMediumIssue := false
	for _, issue := range data.Issues {
		switch issue.Severity {
		case "high":
			hasHighIssue = true
		case "medium":
			hasMediumIssue = true
		}
	}

	anyScoreBelow50 := false
	anyScore50to69 := false

	if data.SectionFit != nil {
		if data.SectionFit.Score < 50 {
			anyScoreBelow50 = true
		} else if data.SectionFit.Score < 70 {
			anyScore50to69 = true
		}
	}

	if data.AnnotationMatch != nil {
		if data.AnnotationMatch.Score < 50 {
			anyScoreBelow50 = true
		} else if data.AnnotationMatch.Score < 70 {
			anyScore50to69 = true
		}
	}

	if anyScoreBelow50 || hasHighIssue {
		return "problem"
	}
	if anyScore50to69 || hasMediumIssue {
		return "attention"
	}
	return "ok"
}
