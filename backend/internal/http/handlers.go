package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"confapp/internal/auth"
	"confapp/internal/config"
	"confapp/internal/docparse"
	mw "confapp/internal/middleware"
	"confapp/internal/models"
	"confapp/internal/repo"
	"confapp/internal/service"
)

// Handler holds route handlers.
type Handler struct {
	svc    *service.Service
	db     *repo.DB
	cfg    *config.Config
	logger *slog.Logger
}

// New creates a new Handler.
func New(svc *service.Service, db *repo.DB, cfg *config.Config, logger *slog.Logger) *Handler {
	return &Handler{svc: svc, db: db, cfg: cfg, logger: logger}
}

// ── Health ───────────────────────────────────

func (h *Handler) Health(c *gin.Context) {
	if err := h.db.Ping(c.Request.Context()); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "DB_ERROR", "база данных недоступна")
		return
	}
	mw.WriteJSON(c, http.StatusOK, gin.H{"status": "ok"})
}

// ── Auth ─────────────────────────────────────

func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат запроса")
		return
	}

	result, err := h.svc.Login(c.Request.Context(), req.Login, req.Password)
	if err != nil {
		mw.WriteError(c, http.StatusUnauthorized, "AUTH_FAILED", err.Error())
		return
	}

	mw.WriteJSON(c, http.StatusOK, result)
}

func (h *Handler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат запроса")
		return
	}

	result, err := h.svc.Register(c.Request.Context(), req)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "REGISTER_FAILED", err.Error())
		return
	}

	mw.WriteJSON(c, http.StatusCreated, result)
}

func (h *Handler) Me(c *gin.Context) {
	user := mw.GetUser(c)
	if user == nil {
		mw.WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "не авторизован")
		return
	}
	mw.WriteJSON(c, http.StatusOK, user.ToPublic())
}

func (h *Handler) ChangePassword(c *gin.Context) {
	user := mw.GetUser(c)
	if user == nil {
		mw.WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "не авторизован")
		return
	}

	var req service.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат запроса")
		return
	}

	result, err := h.svc.ChangePassword(c.Request.Context(), user, req)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	mw.WriteJSON(c, http.StatusOK, result)
}

// ── Public: Conferences ──────────────────────

func (h *Handler) ListConferences(c *gin.Context) {
	list, err := h.db.ListConferences(c.Request.Context())
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка загрузки конференций")
		return
	}
	if list == nil {
		list = []models.Conference{}
	}
	mw.WriteJSON(c, http.StatusOK, list)
}

func (h *Handler) GetCurrentConference(c *gin.Context) {
	conf, err := h.db.GetCurrentConference(c.Request.Context())
	if err != nil || conf == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "текущая конференция не найдена")
		return
	}
	mw.WriteJSON(c, http.StatusOK, conf)
}

// ── Public: Sections ─────────────────────────

func (h *Handler) ListSections(c *gin.Context) {
	confIDStr := c.Query("conferenceId")
	var confID int64
	if confIDStr != "" {
		var err error
		confID, err = strconv.ParseInt(confIDStr, 10, 64)
		if err != nil {
			mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный conferenceId")
			return
		}
	} else {
		conf, err := h.db.GetCurrentConference(c.Request.Context())
		if err != nil || conf == nil {
			mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "текущая конференция не найдена")
			return
		}
		confID = conf.ID
	}

	list, err := h.db.ListSections(c.Request.Context(), confID)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка загрузки секций")
		return
	}
	if list == nil {
		list = []models.Section{}
	}
	mw.WriteJSON(c, http.StatusOK, list)
}

// ── Public: Talks ────────────────────────────

func (h *Handler) ListConferenceTalks(c *gin.Context) {
	confID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id конференции")
		return
	}

	statusParam := c.DefaultQuery("status", "approved")

	// Non-approved statuses require jury/admin
	if statusParam != "approved" {
		user := mw.GetUser(c)
		if user == nil || (user.Role != "jury" && user.Role != "admin") {
			mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "недостаточно прав")
			return
		}
	}

	sectionIDStr := c.Query("sectionId")
	q := c.Query("q")
	tag := c.Query("tag")

	var sectionIDPtr, qPtr, tagPtr *string
	if sectionIDStr != "" {
		sectionIDPtr = &sectionIDStr
	}
	if q != "" {
		qPtr = &q
	}
	if tag != "" {
		tagPtr = &tag
	}

	talks, err := h.db.ListTalks(c.Request.Context(), confID, &statusParam, sectionIDPtr, qPtr, tagPtr)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка загрузки докладов")
		return
	}
	if talks == nil {
		talks = []models.Talk{}
	}

	// Join sections and rooms
	for i := range talks {
		if talks[i].SectionID != nil {
			talks[i].Section, _ = h.db.GetSection(c.Request.Context(), *talks[i].SectionID)
		}
		if talks[i].RoomID != nil {
			talks[i].Room, _ = h.db.GetRoom(c.Request.Context(), *talks[i].RoomID)
		}
	}

	// For public, strip internal fields
	user := mw.GetUser(c)
	if user == nil || (user.Role != "jury" && user.Role != "admin") {
		result := make([]models.TalkPublic, len(talks))
		for i, t := range talks {
			result[i] = t.ToPublic()
		}
		mw.WriteJSON(c, http.StatusOK, result)
		return
	}

	// Jury and admin cards show the attached files straight from this list
	for i := range talks {
		talks[i].Document, _ = h.db.GetDocument(c.Request.Context(), talks[i].ID)
		talks[i].Presentation, _ = h.db.GetPresentation(c.Request.Context(), talks[i].ID)
	}

	mw.WriteJSON(c, http.StatusOK, talks)
}

func (h *Handler) GetTalk(c *gin.Context) {
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalkWithJoins(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "доклад не найден")
		return
	}

	user := mw.GetUser(c)

	// Guest: only approved
	if user == nil {
		if talk.Status != "approved" {
			mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "доклад не найден")
			return
		}
		mw.WriteJSON(c, http.StatusOK, talk.ToPublic())
		return
	}

	// Author sees own
	if user.Role == "student" && talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "доклад не найден")
		return
	}

	mw.WriteJSON(c, http.StatusOK, talk)
}

// ── Student: My Talks ────────────────────────

func (h *Handler) ListMyTalks(c *gin.Context) {
	user := mw.GetUser(c)
	talks, err := h.db.ListTalksByAuthor(c.Request.Context(), user.ID)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка загрузки заявок")
		return
	}
	if talks == nil {
		talks = []models.Talk{}
	}

	// Join sections, rooms, documents, and AI results
	for i := range talks {
		if talks[i].SectionID != nil {
			talks[i].Section, _ = h.db.GetSection(c.Request.Context(), *talks[i].SectionID)
		}
		if talks[i].RoomID != nil {
			talks[i].Room, _ = h.db.GetRoom(c.Request.Context(), *talks[i].RoomID)
		}
		doc, _ := h.db.GetDocument(c.Request.Context(), talks[i].ID)
		talks[i].Document = doc
		ai, _ := h.db.GetLatestAIResult(c.Request.Context(), talks[i].ID)
		talks[i].AIResult = ai
	}

	mw.WriteJSON(c, http.StatusOK, talks)
}

func (h *Handler) GetMyTalk(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalkWithJoins(c.Request.Context(), talkID)
	if err != nil || talk == nil || talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	// Get document info
	doc, _ := h.db.GetDocument(c.Request.Context(), talkID)
	talk.Document = doc

	// Get presentation info
	pres, _ := h.db.GetPresentation(c.Request.Context(), talkID)
	talk.Presentation = pres

	// Get latest AI result
	aiResult, _ := h.db.GetLatestAIResult(c.Request.Context(), talkID)
	talk.AIResult = aiResult

	mw.WriteJSON(c, http.StatusOK, talk)
}

func (h *Handler) CreateTalk(c *gin.Context) {
	user := mw.GetUser(c)

	var req service.CreateTalkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}

	talk, err := h.svc.CreateTalk(c.Request.Context(), user, req)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "TALK_LIMIT_REACHED" {
			mw.WriteError(c, http.StatusConflict, "TALK_LIMIT_REACHED", "превышен лимит заявок на конференцию")
			return
		}
		if strings.HasPrefix(errMsg, "VALIDATION_ERROR:") {
			parts := strings.SplitN(errMsg, ":", 3)
			if len(parts) == 3 {
				mw.WriteErrorWithFields(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", parts[2], map[string]string{parts[1]: parts[2]})
				return
			}
		}
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", errMsg)
		return
	}

	mw.WriteJSON(c, http.StatusCreated, talk)
}

func (h *Handler) UpdateMyTalk(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil || talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	var req service.UpdateTalkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}

	if err := h.svc.UpdateTalk(c.Request.Context(), talk, req); err != nil {
		errMsg := err.Error()
		if strings.HasPrefix(errMsg, "VALIDATION_ERROR:") {
			parts := strings.SplitN(errMsg, ":", 3)
			if len(parts) == 3 {
				mw.WriteErrorWithFields(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", parts[2], map[string]string{parts[1]: parts[2]})
				return
			}
		}
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", errMsg)
		return
	}

	mw.WriteJSON(c, http.StatusOK, talk)
}

func (h *Handler) DeleteMyTalk(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil || (talk.AuthorID != user.ID && user.Role != "admin") {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	// Remove physical document & presentation if exists
	if docName, err := h.db.GetDocumentStoredName(c.Request.Context(), talkID); err == nil && docName != "" {
		_ = os.Remove(filepath.Join(h.cfg.UploadDir, docName))
	}
	if presName, err := h.db.GetPresentationStoredName(c.Request.Context(), talkID); err == nil && presName != "" {
		_ = os.Remove(filepath.Join(h.cfg.UploadDir, presName))
	}

	if err := h.db.DeleteTalk(c.Request.Context(), talkID); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "не удалось удалить заявку")
		return
	}

	mw.WriteJSON(c, http.StatusOK, gin.H{"deleted": true, "id": talkID})
}

func (h *Handler) AdminDeleteTalk(c *gin.Context) {
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	if docName, err := h.db.GetDocumentStoredName(c.Request.Context(), talkID); err == nil && docName != "" {
		_ = os.Remove(filepath.Join(h.cfg.UploadDir, docName))
	}
	if presName, err := h.db.GetPresentationStoredName(c.Request.Context(), talkID); err == nil && presName != "" {
		_ = os.Remove(filepath.Join(h.cfg.UploadDir, presName))
	}

	if err := h.db.DeleteTalk(c.Request.Context(), talkID); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "не удалось удалить заявку")
		return
	}

	mw.WriteJSON(c, http.StatusOK, gin.H{"deleted": true, "id": talkID})
}

// ── File upload ──────────────────────────────

func (h *Handler) UploadDocument(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil || talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	if talk.Status != "pending_review" && talk.Status != "needs_revision" {
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", "загрузка файла недоступна в этом статусе")
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", "файл не найден в запросе")
		return
	}

	// 10 MB limit check
	if fileHeader.Size > 10*1024*1024 {
		mw.WriteError(c, http.StatusRequestEntityTooLarge, "FILE_TOO_LARGE", "файл слишком большой (макс. 10 МБ)")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка чтения файла")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка чтения файла")
		return
	}

	// Detect type by magic bytes
	mime := docparse.DetectType(data)
	if mime == "" {
		mw.WriteError(c, http.StatusUnsupportedMediaType, "UNSUPPORTED_TYPE", "поддерживаются PDF, DOCX и презентации (PPTX, PPT)")
		return
	}

	// Delete old file if exists
	oldStored, _ := h.db.GetDocumentStoredName(c.Request.Context(), talkID)
	if oldStored != "" {
		os.Remove(filepath.Join(h.cfg.UploadDir, oldStored))
	}

	// Generate random filename
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	ext := ".pdf"
	if strings.Contains(mime, "wordprocessing") {
		ext = ".docx"
	} else if strings.Contains(mime, "presentation") {
		ext = ".pptx"
	} else if strings.Contains(mime, "powerpoint") {
		ext = ".ppt"
	}
	storedName := hex.EncodeToString(randomBytes) + ext

	// Save to disk
	if err := os.MkdirAll(h.cfg.UploadDir, 0755); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка создания каталога")
		return
	}

	if err := os.WriteFile(filepath.Join(h.cfg.UploadDir, storedName), data, 0644); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка сохранения файла")
		return
	}

	// Extract text
	extractedText, hasText, _ := docparse.ExtractText(data, mime)

	var textPtr *string
	var hasTextPtr *bool
	if hasText {
		textPtr = &extractedText
	}
	hasTextPtr = &hasText

	doc := &models.TalkDocument{
		TalkID:        talkID,
		OriginalName:  fileHeader.Filename,
		StoredName:    storedName,
		Mime:          mime,
		SizeBytes:     int64(len(data)),
		ExtractedText: textPtr,
		HasText:       hasTextPtr,
	}

	if err := h.db.UpsertDocument(c.Request.Context(), doc); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка сохранения в БД")
		return
	}

	mw.WriteJSON(c, http.StatusCreated, doc)
}

func (h *Handler) UploadPresentation(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil || talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	if talk.Status != "pending_review" && talk.Status != "needs_revision" {
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", "загрузка файла недоступна в этом статусе")
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", "файл не найден в запросе")
		return
	}

	// 10 MB limit check
	if fileHeader.Size > 10*1024*1024 {
		mw.WriteError(c, http.StatusRequestEntityTooLarge, "FILE_TOO_LARGE", "файл слишком большой (макс. 10 МБ)")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка чтения файла")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка чтения файла")
		return
	}

	// Detect type by magic bytes
	mime := docparse.DetectType(data)
	if mime == "" {
		mw.WriteError(c, http.StatusUnsupportedMediaType, "UNSUPPORTED_TYPE", "поддерживаются презентации (PPTX, PPT) и PDF/DOCX файлы")
		return
	}

	// Delete old file if exists
	oldStored, _ := h.db.GetPresentationStoredName(c.Request.Context(), talkID)
	if oldStored != "" {
		os.Remove(filepath.Join(h.cfg.UploadDir, oldStored))
	}

	// Generate random filename
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	ext := ".pdf"
	if strings.Contains(mime, "wordprocessing") {
		ext = ".docx"
	} else if strings.Contains(mime, "presentation") {
		ext = ".pptx"
	} else if strings.Contains(mime, "powerpoint") {
		ext = ".ppt"
	}
	storedName := "pres_" + hex.EncodeToString(randomBytes) + ext

	// Save to disk
	if err := os.MkdirAll(h.cfg.UploadDir, 0755); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка создания каталога")
		return
	}

	if err := os.WriteFile(filepath.Join(h.cfg.UploadDir, storedName), data, 0644); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка сохранения файла")
		return
	}

	// Extract text
	extractedText, hasText, _ := docparse.ExtractText(data, mime)

	var textPtr *string
	var hasTextPtr *bool
	if hasText {
		textPtr = &extractedText
	}
	hasTextPtr = &hasText

	doc := &models.TalkDocument{
		TalkID:        talkID,
		OriginalName:  fileHeader.Filename,
		StoredName:    storedName,
		Mime:          mime,
		SizeBytes:     int64(len(data)),
		ExtractedText: textPtr,
		HasText:       hasTextPtr,
	}

	if err := h.db.UpsertPresentation(c.Request.Context(), doc); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка сохранения в БД")
		return
	}

	mw.WriteJSON(c, http.StatusCreated, doc)
}

func (h *Handler) DownloadPresentation(c *gin.Context) {
	user := mw.GetUser(c)
	if user == nil {
		mw.WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "необходима авторизация")
		return
	}

	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	// Только автор доклада (студент), жюри и администратор имеют доступ
	if user.Role == "student" && talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "нет доступа к чужой презентации")
		return
	}
	if user.Role != "admin" && user.Role != "jury" && user.Role != "student" {
		mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "недостаточно прав")
		return
	}

	doc, err := h.db.GetPresentation(c.Request.Context(), talkID)
	if err != nil || doc == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "презентация не найдена")
		return
	}

	filePath := filepath.Join(h.cfg.UploadDir, doc.StoredName)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, doc.OriginalName))
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Type", doc.Mime)
	c.File(filePath)
}

// ── AI Validation ────────────────────────────

func (h *Handler) ValidateTalk(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		slog.Warn("[HTTP AI] Invalid talk ID param in ValidateTalk", "param", c.Param("id"))
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	slog.Info("[HTTP AI] POST /api/talks/:id/validate started",
		"talkID", talkID,
		"userID", user.ID,
		"userRole", user.Role,
	)

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		slog.Warn("[HTTP AI] Talk not found for validation", "talkID", talkID)
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}
	if user.Role == "student" && talk.AuthorID != user.ID {
		slog.Warn("[HTTP AI] Forbidden validation attempt", "talkID", talkID, "talkAuthor", talk.AuthorID, "userID", user.ID)
		mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "нет доступа к чужой заявке")
		return
	}

	result, err := h.svc.ValidateTalk(c.Request.Context(), user, talk)
	if err != nil {
		errMsg := err.Error()
		slog.Error("[HTTP AI] ValidateTalk service failed", "talkID", talkID, "error", errMsg)
		switch {
		case errMsg == "AI_LIMIT_REACHED":
			mw.WriteError(c, http.StatusTooManyRequests, "AI_LIMIT_REACHED", "исчерпан лимит AI-проверок на заявку")
		case errMsg == "AI_DAILY_LIMIT_REACHED":
			mw.WriteError(c, http.StatusTooManyRequests, "AI_DAILY_LIMIT_REACHED", "исчерпан дневной лимит AI-проверок")
		case strings.HasPrefix(errMsg, "AI_BAD_RESPONSE"):
			mw.WriteError(c, http.StatusBadGateway, "AI_BAD_RESPONSE", "ошибка AI-сервиса")
		default:
			mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", errMsg)
		}
		return
	}

	slog.Info("[HTTP AI] POST /api/talks/:id/validate succeeded",
		"talkID", talkID,
		"resultID", result.ID,
		"attemptNo", result.AttemptNo,
	)

	mw.WriteJSON(c, http.StatusOK, result)
}

func (h *Handler) GetAIResult(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	// Check access: author, jury, or admin
	if user.Role == "student" && talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "нет доступа")
		return
	}

	result, err := h.db.GetLatestAIResult(c.Request.Context(), talkID)
	if err != nil || result == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_RUN", "AI-проверка ещё не запускалась")
		return
	}

	mw.WriteJSON(c, http.StatusOK, result)
}

// ── Jury ─────────────────────────────────────

func (h *Handler) GetJuryTalk(c *gin.Context) {
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalkWithJoins(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	doc, _ := h.db.GetDocument(c.Request.Context(), talkID)
	talk.Document = doc

	pres, _ := h.db.GetPresentation(c.Request.Context(), talkID)
	talk.Presentation = pres

	aiResult, _ := h.db.GetLatestAIResult(c.Request.Context(), talkID)
	talk.AIResult = aiResult

	mw.WriteJSON(c, http.StatusOK, talk)
}

func (h *Handler) DownloadDocument(c *gin.Context) {
	user := mw.GetUser(c)
	if user == nil {
		mw.WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "необходима авторизация")
		return
	}

	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	// Только автор доклада (студент), жюри и администратор имеют доступ
	if user.Role == "student" && talk.AuthorID != user.ID {
		mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "нет доступа к чужому документу")
		return
	}
	if user.Role != "admin" && user.Role != "jury" && user.Role != "student" {
		mw.WriteError(c, http.StatusForbidden, "FORBIDDEN", "недостаточно прав")
		return
	}

	doc, err := h.db.GetDocument(c.Request.Context(), talkID)
	if err != nil || doc == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "документ не найден")
		return
	}

	filePath := filepath.Join(h.cfg.UploadDir, doc.StoredName)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, doc.OriginalName))
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Type", doc.Mime)
	c.File(filePath)
}

func (h *Handler) ReviewTalk(c *gin.Context) {
	user := mw.GetUser(c)
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	talk, err := h.db.GetTalk(c.Request.Context(), talkID)
	if err != nil || talk == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "заявка не найдена")
		return
	}

	var req service.ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}

	if err := h.svc.ReviewTalk(c.Request.Context(), talk, user.ID, req); err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "exclude") || strings.Contains(errMsg, "overlap") || strings.Contains(errMsg, "conflicting") {
			mw.WriteError(c, http.StatusConflict, "SCHEDULE_CONFLICT", errMsg)
			return
		}
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", errMsg)
		return
	}

	// Reload with joins
	talk, _ = h.db.GetTalkWithJoins(c.Request.Context(), talkID)
	mw.WriteJSON(c, http.StatusOK, talk)
}

func (h *Handler) ListRooms(c *gin.Context) {
	confIDStr := c.Query("conferenceId")
	var confID int64
	if confIDStr != "" {
		var err error
		confID, err = strconv.ParseInt(confIDStr, 10, 64)
		if err != nil {
			mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный conferenceId")
			return
		}
	} else {
		conf, err := h.db.GetCurrentConference(c.Request.Context())
		if err != nil || conf == nil {
			mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "текущая конференция не найдена")
			return
		}
		confID = conf.ID
	}

	rooms, err := h.db.ListRooms(c.Request.Context(), confID)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка загрузки")
		return
	}
	if rooms == nil {
		rooms = []models.Room{}
	}
	mw.WriteJSON(c, http.StatusOK, rooms)
}

// ── Admin ────────────────────────────────────

func (h *Handler) AdminCreateUser(c *gin.Context) {
	var req service.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}

	result, err := h.svc.CreateUser(c.Request.Context(), req)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	mw.WriteJSON(c, http.StatusCreated, result)
}

func (h *Handler) AdminImportUsers(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "BAD_REQUEST", "файл не найден")
		return
	}

	// 5MB max CSV
	if fileHeader.Size > 5*1024*1024 {
		mw.WriteError(c, http.StatusRequestEntityTooLarge, "FILE_TOO_LARGE", "файл слишком большой")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка открытия файла")
		return
	}
	defer file.Close()

	result, err := h.svc.ImportUsersFromCSV(c.Request.Context(), file)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "IMPORT_ERROR", err.Error())
		return
	}

	// Check if CSV format requested
	if c.Query("format") == "csv" {
		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", `attachment; filename="import_result.csv"`)
		c.Status(http.StatusOK)
		fmt.Fprintf(c.Writer, "fullName,groupName,login,tempPassword\n")
		for _, u := range result.Created {
			gn := ""
			if u.GroupName != nil {
				gn = *u.GroupName
			}
			fmt.Fprintf(c.Writer, "%s,%s,%s,%s\n", u.FullName, gn, u.Login, u.TempPassword)
		}
		return
	}

	mw.WriteJSON(c, http.StatusOK, result)
}

func (h *Handler) AdminListUsers(c *gin.Context) {
	roleParam := c.Query("role")
	qParam := c.Query("q")
	activeParam := c.Query("isActive")

	var rolePtr, qPtr *string
	var activePtr *bool
	if roleParam != "" {
		rolePtr = &roleParam
	}
	if qParam != "" {
		qPtr = &qParam
	}
	if activeParam != "" {
		b := activeParam == "true"
		activePtr = &b
	}

	users, err := h.db.ListUsers(c.Request.Context(), rolePtr, qPtr, activePtr)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка загрузки")
		return
	}
	if users == nil {
		users = []models.User{}
	}

	// Return public view
	result := make([]models.UserPublic, len(users))
	for i, u := range users {
		result[i] = u.ToPublic()
	}
	mw.WriteJSON(c, http.StatusOK, result)
}

func (h *Handler) AdminUpdateUser(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	var req struct {
		FullName  *string `json:"fullName"`
		GroupName *string `json:"groupName"`
		Role      *string `json:"role"`
		IsActive  *bool   `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}

	if err := h.db.UpdateUser(c.Request.Context(), userID, req.FullName, req.GroupName, req.Role, req.IsActive); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка обновления")
		return
	}

	user, _ := h.db.GetUserByID(c.Request.Context(), userID)
	if user == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "пользователь не найден")
		return
	}
	mw.WriteJSON(c, http.StatusOK, user.ToPublic())
}

func (h *Handler) AdminResetPassword(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	user, err := h.db.GetUserByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		mw.WriteError(c, http.StatusNotFound, "NOT_FOUND", "пользователь не найден")
		return
	}

	tempPassword, err := auth.GeneratePassword(10)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка генерации пароля")
		return
	}

	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка хеширования")
		return
	}

	if err := h.db.ResetUserPassword(c.Request.Context(), userID, hash); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка сброса пароля")
		return
	}

	mw.WriteJSON(c, http.StatusOK, gin.H{
		"tempPassword": tempPassword,
		"message":      "пароль сброшен, пользователь должен сменить его при входе",
	})
}

func (h *Handler) AdminResetAIAttempts(c *gin.Context) {
	talkID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}

	if err := h.db.ResetAIAttempts(c.Request.Context(), talkID); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка сброса")
		return
	}

	mw.WriteJSON(c, http.StatusOK, gin.H{"status": "ok"})
}

// ── Admin CRUD: Conferences ──────────────────

func (h *Handler) AdminCreateConference(c *gin.Context) {
	var conf models.Conference
	if err := c.ShouldBindJSON(&conf); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}
	if err := h.db.CreateConference(c.Request.Context(), &conf); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка создания")
		return
	}
	mw.WriteJSON(c, http.StatusCreated, conf)
}

func (h *Handler) AdminUpdateConference(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}
	var conf models.Conference
	if err := c.ShouldBindJSON(&conf); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}
	conf.ID = id
	if err := h.db.UpdateConference(c.Request.Context(), &conf); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка обновления")
		return
	}
	mw.WriteJSON(c, http.StatusOK, conf)
}

func (h *Handler) AdminDeleteConference(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}
	if err := h.db.DeleteConference(c.Request.Context(), id); err != nil {
		mw.WriteError(c, http.StatusConflict, "CONFLICT", "нельзя удалить конференцию, на которую есть ссылки")
		return
	}
	mw.WriteJSON(c, http.StatusOK, gin.H{"status": "deleted"})
}

// ── Admin CRUD: Sections ─────────────────────

func (h *Handler) AdminCreateSection(c *gin.Context) {
	var s models.Section
	if err := c.ShouldBindJSON(&s); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}
	if s.ConferenceID == 0 {
		conf, _ := h.db.GetCurrentConference(c.Request.Context())
		if conf != nil {
			s.ConferenceID = conf.ID
		}
	}
	if err := h.db.CreateSection(c.Request.Context(), &s); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка создания")
		return
	}
	mw.WriteJSON(c, http.StatusCreated, s)
}

func (h *Handler) AdminUpdateSection(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}
	var s models.Section
	if err := c.ShouldBindJSON(&s); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}
	s.ID = id
	if err := h.db.UpdateSection(c.Request.Context(), &s); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка обновления")
		return
	}
	if updated, err := h.db.GetSection(c.Request.Context(), id); err == nil && updated != nil {
		s = *updated
	}
	mw.WriteJSON(c, http.StatusOK, s)
}

func (h *Handler) AdminDeleteSection(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}
	force := c.Query("force") == "true"
	if force {
		// Unlink talks from this section so they don't block deletion
		_, _ = h.db.Pool.Exec(c.Request.Context(), `UPDATE talks SET section_id = NULL WHERE section_id = $1`, id)
	} else {
		hasTalks, _ := h.db.SectionHasTalks(c.Request.Context(), id)
		if hasTalks {
			mw.WriteError(c, http.StatusConflict, "CONFLICT", "нельзя удалить секцию, на которую есть заявки")
			return
		}
	}
	if err := h.db.DeleteSection(c.Request.Context(), id); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка удаления")
		return
	}
	mw.WriteJSON(c, http.StatusOK, gin.H{"status": "deleted"})
}

// ── Admin CRUD: Rooms ────────────────────────

func (h *Handler) AdminCreateRoom(c *gin.Context) {
	var room models.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}
	if err := h.db.CreateRoom(c.Request.Context(), &room); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка создания")
		return
	}
	mw.WriteJSON(c, http.StatusCreated, room)
}

func (h *Handler) AdminUpdateRoom(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}
	var room models.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_JSON", "неверный формат")
		return
	}
	room.ID = id
	if err := h.db.UpdateRoom(c.Request.Context(), &room); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка обновления")
		return
	}
	mw.WriteJSON(c, http.StatusOK, room)
}

func (h *Handler) AdminDeleteRoom(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		mw.WriteError(c, http.StatusBadRequest, "INVALID_PARAM", "неверный id")
		return
	}
	force := c.Query("force") == "true"
	if force {
		// Unassign talks scheduled in this room so they return to pending queue
		_, _ = h.db.Pool.Exec(c.Request.Context(), `UPDATE talks SET room_id = NULL, start_time = NULL, end_time = NULL, status = 'pending_review' WHERE room_id = $1`, id)
	} else {
		hasTalks, _ := h.db.RoomHasTalks(c.Request.Context(), id)
		if hasTalks {
			mw.WriteError(c, http.StatusConflict, "CONFLICT", "нельзя удалить аудиторию, которая используется в заявках")
			return
		}
	}
	if err := h.db.DeleteRoom(c.Request.Context(), id); err != nil {
		mw.WriteError(c, http.StatusInternalServerError, "INTERNAL", "ошибка удаления")
		return
	}
	mw.WriteJSON(c, http.StatusOK, gin.H{"status": "deleted"})
}
