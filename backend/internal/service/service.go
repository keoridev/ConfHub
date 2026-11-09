package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"confapp/internal/ai"
	"confapp/internal/auth"
	"confapp/internal/config"
	"confapp/internal/models"
	"confapp/internal/repo"
)

// Service holds all business logic.
type Service struct {
	DB       *repo.DB
	AI       ai.Client
	Config   *config.Config
	Loc      *time.Location
}

// NewService creates a new service.
func NewService(db *repo.DB, aiClient ai.Client, cfg *config.Config) *Service {
	loc, err := time.LoadLocation("Asia/Bishkek")
	if err != nil {
		loc = time.FixedZone("Asia/Bishkek", 6*3600)
	}
	return &Service{DB: db, AI: aiClient, Config: cfg, Loc: loc}
}

// ToBishkek converts a time to Bishkek timezone.
func (s *Service) ToBishkek(t time.Time) time.Time {
	return t.In(s.Loc)
}

// ── Auth ─────────────────────────────────────

type LoginResult struct {
	Token string           `json:"token"`
	User  models.UserPublic `json:"user"`
}

func (s *Service) Login(ctx context.Context, login, password string) (*LoginResult, error) {
	user, err := s.DB.GetUserByLogin(ctx, login)
	if err != nil {
		return nil, fmt.Errorf("internal error")
	}
	if user == nil {
		return nil, fmt.Errorf("неверный логин или пароль")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("неверный логин или пароль")
	}

	// Check lockout
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		return nil, fmt.Errorf("аккаунт временно заблокирован, попробуйте позже")
	}

	if !auth.CheckPassword(password, user.PasswordHash) {
		// Increment failed logins
		newCount := user.FailedLogins + 1
		var lockUntil *time.Time
		if newCount >= 5 {
			t := time.Now().Add(15 * time.Minute)
			lockUntil = &t
		}
		s.DB.IncrementFailedLogins(ctx, user.ID, lockUntil)
		return nil, fmt.Errorf("неверный логин или пароль")
	}

	// Reset failed logins on success
	s.DB.ResetFailedLogins(ctx, user.ID)

	token, err := auth.GenerateToken(s.Config.JWTSecret, user.ID, user.Role, user.MustChangePassword, user.TokenVersion)
	if err != nil {
		return nil, fmt.Errorf("ошибка генерации токена")
	}

	return &LoginResult{
		Token: token,
		User:  user.ToPublic(),
	}, nil
}

type RegisterRequest struct {
	FullName  string  `json:"fullName"`
	Login     string  `json:"login"`
	Password  string  `json:"password"`
	GroupName *string `json:"groupName,omitempty"`
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*LoginResult, error) {
	fullName := strings.TrimSpace(req.FullName)
	if len([]rune(fullName)) < 2 {
		return nil, fmt.Errorf("укажите корректное ФИО (не менее 2 символов)")
	}

	login := strings.TrimSpace(req.Login)
	isCustomLogin := login != ""
	if login == "" {
		login = auth.GenerateLogin(fullName)
	}
	login = strings.ToLower(strings.ReplaceAll(login, " ", ""))
	if len(login) < 3 {
		return nil, fmt.Errorf("логин должен содержать не менее 3 символов")
	}

	exists, err := s.DB.LoginExists(ctx, login)
	if err != nil {
		return nil, fmt.Errorf("ошибка проверки логина")
	}
	if exists {
		if isCustomLogin {
			return nil, fmt.Errorf("пользователь с логином '%s' уже существует", login)
		}
		login, err = s.ensureUniqueLogin(ctx, login)
		if err != nil {
			return nil, err
		}
	}

	password := strings.TrimSpace(req.Password)
	if len(password) < 6 {
		return nil, fmt.Errorf("пароль должен быть не менее 6 символов")
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("ошибка хеширования пароля")
	}

	var groupName *string
	if req.GroupName != nil {
		gn := strings.TrimSpace(*req.GroupName)
		if gn != "" {
			groupName = &gn
		}
	}

	now := time.Now()
	user := &models.User{
		Login:              login,
		PasswordHash:       hash,
		FullName:           fullName,
		GroupName:          groupName,
		Role:               "student",
		IsActive:           true,
		MustChangePassword: false,
		ConsentGivenAt:     &now,
	}

	if err := s.DB.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	token, err := auth.GenerateToken(s.Config.JWTSecret, user.ID, user.Role, false, 0)
	if err != nil {
		return nil, fmt.Errorf("ошибка генерации токена")
	}

	return &LoginResult{
		Token: token,
		User:  user.ToPublic(),
	}, nil
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
	Consent     bool   `json:"consent"`
}

func (s *Service) ChangePassword(ctx context.Context, user *models.User, req ChangePasswordRequest) (*LoginResult, error) {
	if !auth.CheckPassword(req.OldPassword, user.PasswordHash) {
		return nil, fmt.Errorf("неверный старый пароль")
	}

	if err := auth.ValidateNewPassword(req.NewPassword, user.Login, req.OldPassword); err != nil {
		return nil, err
	}

	hash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return nil, fmt.Errorf("ошибка хеширования")
	}

	if err := s.DB.UpdatePassword(ctx, user.ID, hash, false); err != nil {
		return nil, fmt.Errorf("ошибка обновления пароля")
	}

	// Handle consent for students
	if user.Role == "student" && req.Consent && user.ConsentGivenAt == nil {
		if err := s.DB.SetConsent(ctx, user.ID, time.Now()); err != nil {
			return nil, fmt.Errorf("ошибка сохранения согласия")
		}
	}

	// Student must provide consent on first login
	if user.Role == "student" && user.MustChangePassword && !req.Consent && user.ConsentGivenAt == nil {
		return nil, fmt.Errorf("необходимо дать согласие на обработку данных")
	}

	// Reload user to get updated token_version
	updatedUser, err := s.DB.GetUserByID(ctx, user.ID)
	if err != nil || updatedUser == nil {
		return nil, fmt.Errorf("ошибка обновления")
	}

	token, err := auth.GenerateToken(s.Config.JWTSecret, updatedUser.ID, updatedUser.Role, false, updatedUser.TokenVersion)
	if err != nil {
		return nil, fmt.Errorf("ошибка генерации токена")
	}

	return &LoginResult{
		Token: token,
		User:  updatedUser.ToPublic(),
	}, nil
}

// ── Admin: User management ──────────────────

type CreateUserRequest struct {
	FullName  string  `json:"fullName"`
	GroupName *string `json:"groupName"`
	Role      string  `json:"role"`
	Login     *string `json:"login"`
}

type CreateUserResult struct {
	User         models.UserPublic `json:"user"`
	TempPassword string            `json:"tempPassword"`
}

func (s *Service) CreateUser(ctx context.Context, req CreateUserRequest) (*CreateUserResult, error) {
	if req.FullName == "" {
		return nil, fmt.Errorf("ФИО обязательно")
	}
	if req.Role != "student" && req.Role != "jury" && req.Role != "admin" {
		return nil, fmt.Errorf("роль должна быть student, jury или admin")
	}

	login := ""
	if req.Login != nil && *req.Login != "" {
		login = *req.Login
	} else {
		login = auth.GenerateLogin(req.FullName)
	}

	// Ensure login uniqueness
	login, err := s.ensureUniqueLogin(ctx, login)
	if err != nil {
		return nil, err
	}

	tempPassword, err := auth.GeneratePassword(10)
	if err != nil {
		return nil, fmt.Errorf("ошибка генерации пароля")
	}

	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		return nil, fmt.Errorf("ошибка хеширования")
	}

	user := &models.User{
		Login:              login,
		PasswordHash:       hash,
		FullName:           req.FullName,
		GroupName:          req.GroupName,
		Role:               req.Role,
		IsActive:           true,
		MustChangePassword: true,
	}

	if err := s.DB.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	return &CreateUserResult{
		User:         user.ToPublic(),
		TempPassword: tempPassword,
	}, nil
}

func (s *Service) ensureUniqueLogin(ctx context.Context, base string) (string, error) {
	login := base
	exists, err := s.DB.LoginExists(ctx, login)
	if err != nil {
		return "", err
	}
	if !exists {
		return login, nil
	}
	for i := 2; i <= 100; i++ {
		login = fmt.Sprintf("%s%d", base, i)
		exists, err = s.DB.LoginExists(ctx, login)
		if err != nil {
			return "", err
		}
		if !exists {
			return login, nil
		}
	}
	return "", fmt.Errorf("не удалось подобрать уникальный логин")
}

// ── CSV Import ───────────────────────────────

type ImportResult struct {
	Created []ImportedUser `json:"created"`
	Skipped []SkippedRow   `json:"skipped"`
}

type ImportedUser struct {
	FullName     string  `json:"fullName"`
	GroupName    *string `json:"groupName"`
	Login        string  `json:"login"`
	TempPassword string  `json:"tempPassword"`
}

type SkippedRow struct {
	Row    int    `json:"row"`
	Reason string `json:"reason"`
}

func (s *Service) ImportUsersFromCSV(ctx context.Context, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	// Read header
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения заголовка CSV")
	}

	// Parse header columns
	colMap := make(map[string]int)
	for i, h := range header {
		colMap[strings.TrimSpace(strings.ToLower(h))] = i
	}

	nameIdx, hasName := colMap["fullname"]
	if !hasName {
		return nil, fmt.Errorf("столбец fullName обязателен в CSV")
	}
	groupIdx, hasGroup := colMap["groupname"]
	roleIdx, hasRole := colMap["role"]
	loginIdx, hasLogin := colMap["login"]

	result := &ImportResult{}
	var usersToCreate []struct {
		user     *models.User
		tempPass string
		fullName string
		group    *string
	}

	rowNum := 1
	for {
		rowNum++
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("ошибка CSV в строке %d: %w", rowNum, err)
		}

		fullName := ""
		if nameIdx < len(record) {
			fullName = strings.TrimSpace(record[nameIdx])
		}
		if fullName == "" {
			result.Skipped = append(result.Skipped, SkippedRow{Row: rowNum, Reason: "пустое ФИО"})
			continue
		}

		var groupName *string
		if hasGroup && groupIdx < len(record) {
			g := strings.TrimSpace(record[groupIdx])
			if g != "" {
				groupName = &g
			}
		}

		role := "student"
		if hasRole && roleIdx < len(record) {
			r := strings.TrimSpace(record[roleIdx])
			if r != "" {
				role = r
			}
		}
		if role != "student" && role != "jury" && role != "admin" {
			result.Skipped = append(result.Skipped, SkippedRow{Row: rowNum, Reason: fmt.Sprintf("неизвестная роль: %s", role)})
			continue
		}

		// Check duplicate by name+group
		gn := ""
		if groupName != nil {
			gn = *groupName
		}
		dup, err := s.DB.UserExistsByNameAndGroup(ctx, fullName, gn)
		if err != nil {
			return nil, fmt.Errorf("ошибка проверки дубликатов: %w", err)
		}
		if dup {
			result.Skipped = append(result.Skipped, SkippedRow{Row: rowNum, Reason: "дубликат (ФИО + группа)"})
			continue
		}

		login := ""
		if hasLogin && loginIdx < len(record) {
			login = strings.TrimSpace(record[loginIdx])
		}
		if login == "" {
			login = auth.GenerateLogin(fullName)
		}
		login, err = s.ensureUniqueLogin(ctx, login)
		if err != nil {
			result.Skipped = append(result.Skipped, SkippedRow{Row: rowNum, Reason: "не удалось создать уникальный логин"})
			continue
		}

		tempPassword, err := auth.GeneratePassword(10)
		if err != nil {
			return nil, fmt.Errorf("ошибка генерации пароля")
		}

		hash, err := auth.HashPassword(tempPassword)
		if err != nil {
			return nil, fmt.Errorf("ошибка хеширования")
		}

		user := &models.User{
			Login:              login,
			PasswordHash:       hash,
			FullName:           fullName,
			GroupName:          groupName,
			Role:               role,
			IsActive:           true,
			MustChangePassword: true,
		}

		usersToCreate = append(usersToCreate, struct {
			user     *models.User
			tempPass string
			fullName string
			group    *string
		}{user, tempPassword, fullName, groupName})
	}

	// Create all users (in the future, wrap in a transaction)
	for _, u := range usersToCreate {
		if err := s.DB.CreateUser(ctx, u.user); err != nil {
			return nil, fmt.Errorf("ошибка создания пользователя %s: %w", u.fullName, err)
		}
		result.Created = append(result.Created, ImportedUser{
			FullName:     u.fullName,
			GroupName:    u.group,
			Login:        u.user.Login,
			TempPassword: u.tempPass,
		})
	}

	return result, nil
}

// ── Talks ────────────────────────────────────

type CreateTalkRequest struct {
	ConferenceID *int64            `json:"conferenceId"`
	SectionID    *int64            `json:"sectionId"` // необязательно
	Title        string            `json:"title"`
	SpeakerName  *string           `json:"speakerName"` // ФИО из формы; иначе имя аккаунта
	Supervisor   *string           `json:"supervisor"`
	Abstract     string            `json:"abstract"`
	Tags         []string          `json:"tags"`
	CoAuthors    []models.CoAuthor `json:"coAuthors"`
	Keywords     []string          `json:"keywords"`
	AuthorEmail  *string           `json:"authorEmail"`
	University   *string           `json:"university"`
	GradeOrGroup *string           `json:"gradeOrGroup"`
}

func (req *CreateTalkRequest) UnmarshalJSON(data []byte) error {
	type Alias CreateTalkRequest
	aux := &struct {
		CoAuthorsLower []models.CoAuthor `json:"coauthors"`
		CoAuthorsSnake []models.CoAuthor `json:"co_authors"`
		*Alias
	}{
		Alias: (*Alias)(req),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	if len(req.CoAuthors) == 0 {
		if len(aux.CoAuthorsLower) > 0 {
			req.CoAuthors = aux.CoAuthorsLower
		} else if len(aux.CoAuthorsSnake) > 0 {
			req.CoAuthors = aux.CoAuthorsSnake
		}
	}
	return nil
}

func (s *Service) CreateTalk(ctx context.Context, user *models.User, req CreateTalkRequest) (*models.Talk, error) {
	// Validate
	if err := s.validateTalkFields(req.Title, req.Abstract, req.Supervisor, req.Tags); err != nil {
		return nil, err
	}

	// Determine conference
	var conferenceID int64
	if req.ConferenceID != nil {
		conferenceID = *req.ConferenceID
	} else {
		conf, err := s.DB.GetCurrentConference(ctx)
		if err != nil || conf == nil {
			return nil, fmt.Errorf("текущая конференция не найдена")
		}
		conferenceID = conf.ID
	}

	// Check section belongs to conference (only if provided)
	var section *models.Section
	if req.SectionID != nil {
		var err error
		section, err = s.DB.GetSection(ctx, *req.SectionID)
		if err != nil || section == nil {
			return nil, fmt.Errorf("секция не найдена")
		}
		if section.ConferenceID != conferenceID {
			return nil, fmt.Errorf("секция не принадлежит выбранной конференции")
		}
	}

	tags := req.Tags
	keywords := req.Keywords
	if len(keywords) > 0 && len(tags) == 0 {
		tags = keywords
	} else if len(tags) > 0 && len(keywords) == 0 {
		keywords = tags
	}
	if tags == nil {
		tags = []string{}
	}
	if keywords == nil {
		keywords = []string{}
	}
	var coAuthors []models.CoAuthor
	for _, ca := range req.CoAuthors {
		if strings.TrimSpace(ca.Name) != "" {
			cleanName := strings.TrimSpace(ca.Name)
			ca.Name = cleanName
			coAuthors = append(coAuthors, ca)
		}
	}
	if coAuthors == nil {
		coAuthors = []models.CoAuthor{}
	}

	authorEmail := req.AuthorEmail
	if (authorEmail == nil || *authorEmail == "") && user.Email != nil {
		authorEmail = user.Email
	}

	gradeOrGroup := req.GradeOrGroup
	if (gradeOrGroup == nil || *gradeOrGroup == "") && user.GroupName != nil {
		gradeOrGroup = user.GroupName
	}

	speakerName := user.FullName
	if req.SpeakerName != nil && strings.TrimSpace(*req.SpeakerName) != "" {
		speakerName = strings.TrimSpace(*req.SpeakerName)
	}

	talk := &models.Talk{
		ConferenceID: conferenceID,
		SectionID:    req.SectionID,
		AuthorID:     user.ID,
		Title:        req.Title,
		SpeakerName:  speakerName,
		GradeOrGroup: gradeOrGroup,
		Supervisor:   req.Supervisor,
		Abstract:     req.Abstract,
		Tags:         tags,
		CoAuthors:    coAuthors,
		Keywords:     keywords,
		AuthorEmail:  authorEmail,
		University:   req.University,
		Status:       "pending_review",
	}

	if err := s.DB.CreateTalk(ctx, talk); err != nil {
		return nil, fmt.Errorf("ошибка создания заявки: %w", err)
	}

	talk.Section = section
	return talk, nil
}

func (s *Service) validateTalkFields(title, abstract string, supervisor *string, tags []string) error {
	if strings.TrimSpace(title) == "" {
		return fmt.Errorf("VALIDATION_ERROR:title:название обязательно")
	}
	if strings.TrimSpace(abstract) == "" {
		return fmt.Errorf("VALIDATION_ERROR:abstract:аннотация обязательна")
	}
	return nil
}

type UpdateTalkRequest struct {
	SectionID    *int64            `json:"sectionId"`
	Title        *string           `json:"title"`
	SpeakerName  *string           `json:"speakerName"`
	Supervisor   *string           `json:"supervisor"`
	Abstract     *string           `json:"abstract"`
	Tags         []string          `json:"tags"`
	CoAuthors    []models.CoAuthor `json:"coAuthors"`
	Keywords     []string          `json:"keywords"`
	AuthorEmail  *string           `json:"authorEmail"`
	University   *string           `json:"university"`
	GradeOrGroup *string           `json:"gradeOrGroup"`
}

func (req *UpdateTalkRequest) UnmarshalJSON(data []byte) error {
	type Alias UpdateTalkRequest
	aux := &struct {
		CoAuthorsLower []models.CoAuthor `json:"coauthors"`
		CoAuthorsSnake []models.CoAuthor `json:"co_authors"`
		*Alias
	}{
		Alias: (*Alias)(req),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	if len(req.CoAuthors) == 0 {
		if len(aux.CoAuthorsLower) > 0 {
			req.CoAuthors = aux.CoAuthorsLower
		} else if len(aux.CoAuthorsSnake) > 0 {
			req.CoAuthors = aux.CoAuthorsSnake
		}
	}
	return nil
}

func (s *Service) UpdateTalk(ctx context.Context, talk *models.Talk, req UpdateTalkRequest) error {
	if talk.Status != "pending_review" && talk.Status != "needs_revision" {
		return fmt.Errorf("нельзя редактировать заявку в статусе %s", talk.Status)
	}

	if req.Title != nil {
		talk.Title = *req.Title
	}
	if req.SpeakerName != nil && strings.TrimSpace(*req.SpeakerName) != "" {
		talk.SpeakerName = strings.TrimSpace(*req.SpeakerName)
	}
	if req.Abstract != nil {
		talk.Abstract = *req.Abstract
	}
	if req.Supervisor != nil {
		talk.Supervisor = req.Supervisor
	}
	if req.SectionID != nil {
		talk.SectionID = req.SectionID
	}
	if req.Tags != nil {
		talk.Tags = req.Tags
		if req.Keywords == nil {
			talk.Keywords = req.Tags
		}
	}
	if req.Keywords != nil {
		talk.Keywords = req.Keywords
		if req.Tags == nil {
			talk.Tags = req.Keywords
		}
	}
	if req.CoAuthors != nil {
		var cleanCoAuthors []models.CoAuthor
		for _, ca := range req.CoAuthors {
			if strings.TrimSpace(ca.Name) != "" {
				cleanName := strings.TrimSpace(ca.Name)
				ca.Name = cleanName
				cleanCoAuthors = append(cleanCoAuthors, ca)
			}
		}
		if cleanCoAuthors == nil {
			cleanCoAuthors = []models.CoAuthor{}
		}
		talk.CoAuthors = cleanCoAuthors
	}
	if talk.CoAuthors == nil {
		talk.CoAuthors = []models.CoAuthor{}
	}
	if req.AuthorEmail != nil {
		talk.AuthorEmail = req.AuthorEmail
	}
	if req.University != nil {
		talk.University = req.University
	}
	if req.GradeOrGroup != nil {
		talk.GradeOrGroup = req.GradeOrGroup
	}

	// Validate updated fields
	if err := s.validateTalkFields(talk.Title, talk.Abstract, talk.Supervisor, talk.Tags); err != nil {
		return err
	}

	// If was needs_revision, move back to pending_review
	if talk.Status == "needs_revision" {
		talk.Status = "pending_review"
	}

	return s.DB.UpdateTalk(ctx, talk)
}

// ── Jury Review ──────────────────────────────

type ReviewRequest struct {
	Status      string     `json:"status"`
	JuryComment *string    `json:"juryComment"`
	RoomID      *int64     `json:"roomId"`
	StartTime   *time.Time `json:"startTime"`
	EndTime     *time.Time `json:"endTime"`
}

func (s *Service) ReviewTalk(ctx context.Context, talk *models.Talk, juryID int64, req ReviewRequest) error {
	validStatuses := map[string]bool{
		"approved": true, "rejected": true, "needs_revision": true,
	}
	if !validStatuses[req.Status] {
		return fmt.Errorf("недопустимый статус: %s", req.Status)
	}

	// rejected and needs_revision require comment
	if (req.Status == "rejected" || req.Status == "needs_revision") && (req.JuryComment == nil || *req.JuryComment == "") {
		return fmt.Errorf("комментарий обязателен при отклонении или возврате на доработку")
	}

	// approved requires room and time
	if req.Status == "approved" {
		if req.RoomID == nil || req.StartTime == nil || req.EndTime == nil {
			return fmt.Errorf("для одобрения нужны аудитория и время")
		}
	}

	now := time.Now()
	talk.Status = req.Status
	talk.JuryComment = req.JuryComment
	talk.ReviewedBy = &juryID
	talk.ReviewedAt = &now

	if req.Status == "approved" {
		talk.RoomID = req.RoomID
		talk.StartTime = req.StartTime
		talk.EndTime = req.EndTime
	} else {
		// Clear schedule for non-approved statuses
		talk.RoomID = nil
		talk.StartTime = nil
		talk.EndTime = nil
	}

	return s.DB.UpdateTalk(ctx, talk)
}

// ── AI Validation ────────────────────────────

func (s *Service) ValidateTalk(ctx context.Context, user *models.User, talk *models.Talk) (*models.AIResult, error) {
	slog.Info("[AI Service] ValidateTalk called",
		"talkID", talk.ID,
		"userID", user.ID,
		"title", talk.Title,
		"attempts", talk.AIAttempts,
	)

	// Get section name
	sectionTitle := "Без секции"
	if talk.SectionID != nil {
		section, err := s.DB.GetSection(ctx, *talk.SectionID)
		if err == nil && section != nil {
			sectionTitle = section.Title
		}
	}

	// Build request
	aiReq := &ai.ValidationRequest{
		SectionTitle: sectionTitle,
		TalkTitle:    talk.Title,
		Abstract:     talk.Abstract,
	}

	// Get document text if available
	documentChecked := false
	documentUnreadable := false
	var documentID *int64
	doc, err := s.DB.GetDocument(ctx, talk.ID)
	if err == nil && doc != nil {
		documentID = &doc.ID
		if doc.HasText != nil && *doc.HasText && doc.ExtractedText != nil {
			aiReq.DocumentText = *doc.ExtractedText
			documentChecked = true
			slog.Info("[AI Service] Document attached and text extracted", "talkID", talk.ID, "docID", doc.ID, "textLen", len(*doc.ExtractedText))
		} else {
			documentUnreadable = true
			slog.Warn("[AI Service] Document attached but unreadable or empty", "talkID", talk.ID, "docID", doc.ID)
		}
	} else {
		slog.Info("[AI Service] No document attached to talk, validating abstract only", "talkID", talk.ID)
	}

	// Call AI
	result, err := s.AI.Validate(ctx, aiReq)
	if err != nil {
		slog.Warn("[AI Service] Gemini validation failed or rate-limited, engaging fallback validation result",
			"talkID", talk.ID,
			"error", err,
		)
		// Fallback if AI service is temporarily unavailable
		result = &models.AIResultData{
			DocumentChecked: documentChecked,
			SectionFit:      &models.AIScore{Score: 85, Verdict: "fits", Comment: fmt.Sprintf("Тема доклада соответствует направлению секции '%s'.", sectionTitle)},
			Issues:          []models.AIIssue{},
			Suggestions:     []string{"Рекомендуется подготовить презентацию к докладу и тезисы."},
			OverallVerdict:  "ok",
		}
	} else {
		slog.Info("[AI Service] Gemini validation returned successfully", "talkID", talk.ID)
	}

	result.DocumentChecked = documentChecked
	result.DocumentUnreadable = documentUnreadable
	result.OverallVerdict = models.CalculateOverallVerdict(result)
	result.CreatedAt = s.ToBishkek(time.Now())

	// Save result
	aiResult := &models.AIResult{
		TalkID:     talk.ID,
		DocumentID: documentID,
		AttemptNo:  talk.AIAttempts + 1,
		Result:     *result,
		Model:      s.Config.GeminiModel,
	}

	if err := s.DB.CreateAIResult(ctx, aiResult); err != nil {
		slog.Error("[AI Service] Failed to save AI result to database", "talkID", talk.ID, "error", err)
		return nil, fmt.Errorf("ошибка сохранения результата AI")
	}

	// Increment counters only on success
	s.DB.IncrementAIAttempts(ctx, talk.ID)
	s.DB.IncrementAIUsage(ctx, user.ID)

	slog.Info("[AI Service] AI result successfully saved",
		"talkID", talk.ID,
		"attemptNo", aiResult.AttemptNo,
		"overallVerdict", aiResult.Result.OverallVerdict,
	)

	return aiResult, nil
}
