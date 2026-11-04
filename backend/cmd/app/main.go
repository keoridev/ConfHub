package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"syscall"
	"time"

	"confapp/internal/ai"
	"confapp/internal/auth"
	"confapp/internal/config"
	handler "confapp/internal/http"
	"confapp/internal/models"
	"confapp/internal/repo"
	"confapp/internal/service"
)

func main() {
	seedFlag := flag.Bool("seed", false, "Seed the database with test data")
	migrateFlag := flag.Bool("migrate", false, "Run database migrations")
	prodFlag := flag.Bool("prod", false, "Production mode (seed creates only admin)")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("config load failed", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()

	db, err := repo.NewDB(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if *migrateFlag {
		logger.Info("running migrations...")
		if err := runMigrations(ctx, db); err != nil {
			logger.Error("migration failed", "error", err)
			os.Exit(1)
		}
		logger.Info("migrations complete")
		if !*seedFlag {
			return
		}
	}

	if *seedFlag {
		logger.Info("seeding database...")
		if err := seed(ctx, db, cfg, *prodFlag); err != nil {
			logger.Error("seed failed", "error", err)
			os.Exit(1)
		}
		logger.Info("seed complete")
		return
	}

	// ── Start server ─────────────────────────
	var aiClient ai.Client
	if cfg.GeminiAPIKey != "" {
		aiClient = ai.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel)
		logger.Info("Gemini AI client initialized", "model", cfg.GeminiModel)
	} else {
		aiClient = &ai.MockClient{
			Result: &models.AIResultData{
				DocumentChecked: false,
				SectionFit:      &models.AIScore{Score: 75, Verdict: "fits", Comment: "AI not configured, using mock"},
				Issues:          []models.AIIssue{},
				Suggestions:     []string{"Настройте GEMINI_API_KEY для реальной проверки"},
				OverallVerdict:  "ok",
			},
		}
		logger.Warn("Gemini API key not configured, using mock AI client")
	}

	svc := service.NewService(db, aiClient, cfg)
	h := handler.New(svc, db, cfg, logger)
	router := handler.NewRouter(h, cfg.JWTSecret, db, cfg.CORSOrigins)

	addr := ":" + cfg.Port
	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 90 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	logger.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", "error", err)
	}
	logger.Info("server stopped")
}

// runMigrations reads and executes SQL migration files.
func runMigrations(ctx context.Context, db *repo.DB) error {
	_, err := db.Pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		);
	`)
	if err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// Backfill already applied migrations if schema was created before tracking
	var count int
	_ = db.Pool.QueryRow(ctx, "SELECT count(*) FROM schema_migrations").Scan(&count)
	if count == 0 {
		var hasUsers, hasTalkPresentations bool
		_ = db.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users')").Scan(&hasUsers)
		_ = db.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'talk_presentations')").Scan(&hasTalkPresentations)
		if hasUsers {
			_, _ = db.Pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ('001_init.sql') ON CONFLICT DO NOTHING")
		}
		if hasTalkPresentations {
			_, _ = db.Pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ('002_add_fields.sql') ON CONFLICT DO NOTHING")
		}
	}

	dir := "migrations"
	entries, err := os.ReadDir(dir)
	if err != nil {
		dir = "/migrations"
		entries, err = os.ReadDir(dir)
		if err != nil {
			return fmt.Errorf("cannot read migrations dir: %w", err)
		}
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, filepath.Join(dir, e.Name()))
		}
	}
	sort.Strings(files)

	for _, file := range files {
		version := filepath.Base(file)
		var applied bool
		err := db.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", version).Scan(&applied)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", version, err)
		}
		if applied {
			continue
		}

		data, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("cannot read migration file %s: %w", file, err)
		}

		sql := string(data)
		upStart := indexOf(sql, "-- +goose Up")
		downStart := indexOf(sql, "-- +goose Down")

		if upStart == -1 {
			continue
		}

		upSQL := ""
		if downStart > upStart {
			upSQL = sql[upStart+len("-- +goose Up") : downStart]
		} else {
			upSQL = sql[upStart+len("-- +goose Up"):]
		}

		if strings.TrimSpace(upSQL) != "" {
			if _, err := db.Pool.Exec(ctx, upSQL); err != nil {
				return fmt.Errorf("exec migration %s: %w", file, err)
			}
		}

		if _, err := db.Pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING", version); err != nil {
			return fmt.Errorf("record migration %s: %w", version, err)
		}
		slog.Info("applied migration", "file", version)
	}

	return nil
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// seed populates the database with test data.
func seed(ctx context.Context, db *repo.DB, cfg *config.Config, prodMode bool) error {
	loc, err := time.LoadLocation("Asia/Bishkek")
	if err != nil {
		loc = time.FixedZone("Asia/Bishkek", 6*3600)
	}

	// ── Admin ────────────────────────────────
	existing, _ := db.GetUserByLogin(ctx, cfg.SeedAdminLogin)
	if existing == nil {
		hash, err := auth.HashPassword(cfg.SeedAdminPassword)
		if err != nil {
			return fmt.Errorf("hash admin password: %w", err)
		}
		now := time.Now().In(loc)
		admin := &models.User{
			Login:              cfg.SeedAdminLogin,
			PasswordHash:       hash,
			FullName:           "Администратор",
			Role:               "admin",
			IsActive:           true,
			MustChangePassword: false,
			ConsentGivenAt:     &now,
		}
		if err := db.CreateUser(ctx, admin); err != nil {
			return fmt.Errorf("create admin: %w", err)
		}
		slog.Info("created admin user", "login", cfg.SeedAdminLogin)
	}

	if prodMode {
		slog.Info("production mode: only admin created")
		return nil
	}

	// ── Jury ─────────────────────────────────
	juryUsers := []struct {
		login    string
		fullName string
	}{
		{"jury1", "Асанов Бакыт Маратович"},
		{"jury2", "Тургунова Айгуль Сапарбековна"},
	}
	for _, j := range juryUsers {
		existing, _ := db.GetUserByLogin(ctx, j.login)
		if existing != nil {
			continue
		}
		hash, _ := auth.HashPassword("jury123")
		now := time.Now().In(loc)
		user := &models.User{
			Login:              j.login,
			PasswordHash:       hash,
			FullName:           j.fullName,
			Role:               "jury",
			IsActive:           true,
			MustChangePassword: false,
			ConsentGivenAt:     &now,
		}
		if err := db.CreateUser(ctx, user); err != nil {
			return fmt.Errorf("create jury %s: %w", j.login, err)
		}
		slog.Info("created jury user", "login", j.login)
	}

	// ── Students ─────────────────────────────
	studentUsers := []struct {
		login     string
		fullName  string
		groupName string
	}{
		{"student1", "Иванов Алексей Петрович", "ИС-21"},
		{"student2", "Касымова Динара Эркиновна", "ИС-22"},
	}
	var studentIDs []int64
	for _, s := range studentUsers {
		existing, _ := db.GetUserByLogin(ctx, s.login)
		if existing != nil {
			studentIDs = append(studentIDs, existing.ID)
			continue
		}
		hash, _ := auth.HashPassword("student123")
		now := time.Now().In(loc)
		gn := s.groupName
		user := &models.User{
			Login:              s.login,
			PasswordHash:       hash,
			FullName:           s.fullName,
			GroupName:          &gn,
			Role:               "student",
			IsActive:           true,
			MustChangePassword: false,
			ConsentGivenAt:     &now,
		}
		if err := db.CreateUser(ctx, user); err != nil {
			return fmt.Errorf("create student %s: %w", s.login, err)
		}
		slog.Info("created student user", "login", s.login)
		studentIDs = append(studentIDs, user.ID)
	}

	// ── Conference ───────────────────────────
	conf, _ := db.GetCurrentConference(ctx)
	if conf == nil {
		startsAt := time.Date(2026, 10, 20, 9, 0, 0, 0, loc)
		endsAt := time.Date(2026, 10, 20, 17, 0, 0, 0, loc)
		conf = &models.Conference{
			Title:     "Студенческая научно-практическая конференция COMTEHNO 2026",
			StartsAt:  &startsAt,
			EndsAt:    &endsAt,
			IsCurrent: true,
		}
		if err := db.CreateConference(ctx, conf); err != nil {
			return fmt.Errorf("create conference: %w", err)
		}
		slog.Info("created conference", "id", conf.ID)
	}

	// ── Sections ─────────────────────────────
	sectionTitles := []string{
		"Искусственный интеллект и машинное обучение в устойчивом развитии",
		"Традиции и инновации в архитектурном и дизайнерском решениях",
		"Динамика и исследование сейсмостойкости сооружений",
		"Энергоэффективные композиционные материалы для зеленого строительства",
		"Управление инновациями в секторах экономики (промышленность, строительство, транспорт, электроэнергетика, агропромышленный комплекс)",
		"Энергосберегающие и экологически чистые производства и транспорт",
		"Правовые и социально-экономические аспекты устойчивого развития",
		"История развития, современное состояние и перспективы совершенствования системы учета и экономического развития",
		"Цифровизация, качество и устойчивость в системе образования",
		"Современные стратегии маркетинговых исследований и электронной коммерции",
		"Вызовы и возможности для специалистов будущего: инновации, практики и перспективы",
		"Язык и мышление: психологические и лингвистические аспекты",
	}
	existingSections, _ := db.ListSections(ctx, conf.ID)
	sectionIDs := make([]int64, 0)
	existingMap := make(map[string]int64)
	for _, s := range existingSections {
		existingMap[s.Title] = s.ID
		sectionIDs = append(sectionIDs, s.ID)
	}

	for i, title := range sectionTitles {
		if _, exists := existingMap[title]; !exists {
			sec := &models.Section{
				ConferenceID: conf.ID,
				Title:        title,
				SortOrder:    i + 1,
			}
			if err := db.CreateSection(ctx, sec); err == nil {
				sectionIDs = append(sectionIDs, sec.ID)
				existingMap[title] = sec.ID
			}
		}
	}
	slog.Info("ensured sections", "total", len(existingMap))

	// ── Rooms ────────────────────────────────
	roomNames := []string{"Ауд. 101", "Ауд. 204", "Ауд. 305", "Конференц-зал"}
	existingRooms, _ := db.ListRooms(ctx, conf.ID)
	roomIDs := make([]int64, 0)
	if len(existingRooms) == 0 {
		for _, name := range roomNames {
			room := &models.Room{
				ConferenceID: conf.ID,
				Name:         name,
			}
			if err := db.CreateRoom(ctx, room); err != nil {
				return fmt.Errorf("create room %s: %w", name, err)
			}
			roomIDs = append(roomIDs, room.ID)
		}
		slog.Info("created rooms", "count", len(roomNames))
	} else {
		for _, r := range existingRooms {
			roomIDs = append(roomIDs, r.ID)
		}
	}

	// ── Talks ────────────────────────────────
	if len(studentIDs) < 2 || len(sectionIDs) < 2 || len(roomIDs) < 2 {
		slog.Warn("not enough data for talks, skipping")
		return nil
	}

	// Check if talks already exist
	existingTalks, _ := db.ListTalks(ctx, conf.ID, nil, nil, nil, nil)
	if len(existingTalks) > 0 {
		slog.Info("talks already exist, skipping")
		return nil
	}

	type talkSeed struct {
		title      string
		abstract   string
		authorIdx  int
		sectionIdx int
		status     string
		roomIdx    int
		startHour  int
		startMin   int
		endHour    int
		endMin     int
		tags       []string
		coAuthors  []models.CoAuthor
		keywords   []string
		university string
		email      string
		supervisor string
	}

	talks := []talkSeed{
		{
			title:      "Применение нейросетей для классификации растений",
			abstract:   "В данной работе рассматривается применение свёрточных нейронных сетей для автоматической классификации растений по фотографиям. Используется датасет из 5000 изображений. Точность классификации составила 94%. Работа демонстрирует перспективы применения глубокого обучения в ботанике.",
			authorIdx:  0, sectionIdx: 0, status: "approved",
			roomIdx: 0, startHour: 10, startMin: 0, endHour: 10, endMin: 15,
			tags: []string{"ml", "нейросети"}, keywords: []string{"ml", "нейросети", "компьютерное зрение"},
			coAuthors: []models.CoAuthor{
				{
					Name:       "Абдылдаев Т.М.",
					University: strPtr("КГТУ им. И. Раззакова"),
					Group:      strPtr("ИС-21"),
					Email:      strPtr("abdyldaev@kstu.kg"),
				},
			},
			university: "КГТУ им. И. Раззакова", email: "student1@kstu.kg",
			supervisor: "Мамбетов К.Б.",
		},
		{
			title:      "Умный дом на базе Arduino и IoT-датчиков",
			abstract:   "Проект посвящён разработке системы умного дома на базе микроконтроллера Arduino и набора IoT-датчиков. Реализовано управление освещением, температурой и системой безопасности через мобильное приложение. Стоимость прототипа составила менее 50 долларов.",
			authorIdx:  0, sectionIdx: 1, status: "approved",
			roomIdx: 1, startHour: 11, startMin: 0, endHour: 11, endMin: 15,
			tags: []string{"arduino", "iot"}, keywords: []string{"arduino", "iot", "микроконтроллеры"},
			coAuthors: []models.CoAuthor{
				{
					Name:       "Осмонов А.К.",
					University: strPtr("КГТУ им. И. Раззакова"),
					Group:      strPtr("ИС-21"),
				},
			},
			university: "КГТУ им. И. Раззакова", email: "student1@kstu.kg",
			supervisor: "Токтосунов А.А.",
		},
		{
			title:      "Влияние микропластика на экосистему озера Иссык-Куль",
			abstract:   "Исследование уровня загрязнения микропластиком прибрежных вод озера Иссык-Куль. Собрано 50 проб воды в 10 точках. Обнаружено превышение допустимых норм в 3 из 10 точек. Предложены рекомендации по снижению загрязнения и повышению экологической культуры населения.",
			authorIdx:  1, sectionIdx: 2, status: "approved",
			roomIdx: 2, startHour: 10, startMin: 30, endHour: 10, endMin: 45,
			tags: []string{"экология", "иссык-куль"}, keywords: []string{"экология", "иссык-куль", "микропластик"},
			university: "КНУ им. Ж. Баласагына", email: "kasymova@knu.kg",
			supervisor: "Бейшеева Г.М.",
		},
		{
			title:      "Разработка чат-бота для приёмной комиссии колледжа",
			abstract:   "Создание Telegram-бота, который отвечает на типичные вопросы абитуриентов о поступлении, специальностях и документах. Бот использует базу знаний из 200 вопросов и обрабатывает до 100 запросов в день. Протестирован на группе из 30 абитуриентов.",
			authorIdx:  1, sectionIdx: 0, status: "pending_review",
			tags: []string{"чат-бот", "telegram"}, keywords: []string{"чат-бот", "telegram", "автоматизация"},
			coAuthors: []models.CoAuthor{
				{
					Name:       "Исаков Д.С.",
					University: strPtr("КНУ им. Ж. Баласагына"),
					Group:      strPtr("ПИ-22"),
				},
			},
			university: "КНУ им. Ж. Баласагына", email: "kasymova@knu.kg",
		},
		{
			title:      "Анализ качества воздуха в городе Бишкек за 2025 год",
			abstract:   "Работа посвящена анализу данных мониторинга качества воздуха в Бишкеке. Использованы данные с 12 станций за весь 2025 год. Выявлены сезонные закономерности: пики загрязнения приходятся на январь и февраль. Предложены рекомендации для городских властей.",
			authorIdx:  0, sectionIdx: 2, status: "needs_revision",
			tags: []string{"экология", "воздух"}, keywords: []string{"экология", "воздух", "бишкек"},
			university: "КГТУ им. И. Раззакова", email: "student1@kstu.kg",
			supervisor: "Бейшеева Г.М.",
		},
		{
			title:      "Система распознавания дорожных знаков для беспилотных автомобилей",
			abstract:   "В работе представлена система распознавания дорожных знаков с использованием компьютерного зрения. Обучена модель YOLOv8 на датасете из 10000 изображений. Достигнута точность 97% на тестовой выборке. Рассмотрены перспективы применения в условиях Кыргызстана.",
			authorIdx:  1, sectionIdx: 0, status: "rejected",
			tags: []string{"cv", "yolo"}, keywords: []string{"cv", "yolo", "нейросети"},
			university: "КНУ им. Ж. Баласагына", email: "kasymova@knu.kg",
		},
	}

	for _, ts := range talks {
		authorID := studentIDs[ts.authorIdx]
		sectionID := sectionIDs[ts.sectionIdx]

		author, _ := db.GetUserByID(ctx, authorID)
		speakerName := "Студент"
		var gradeOrGroup *string
		if author != nil {
			speakerName = author.FullName
			gradeOrGroup = author.GroupName
		}

		sup := ts.supervisor
		var supPtr *string
		if sup != "" {
			supPtr = &sup
		}

		var univPtr *string
		if ts.university != "" {
			univPtr = &ts.university
		}

		var emailPtr *string
		if ts.email != "" {
			emailPtr = &ts.email
		}

		coAuthors := ts.coAuthors
		if coAuthors == nil {
			coAuthors = []models.CoAuthor{}
		}

		keywords := ts.keywords
		if keywords == nil {
			keywords = []string{}
		}

		talk := &models.Talk{
			ConferenceID: conf.ID,
			SectionID:    &sectionID,
			AuthorID:     authorID,
			Title:        ts.title,
			SpeakerName:  speakerName,
			GradeOrGroup: gradeOrGroup,
			Supervisor:   supPtr,
			Abstract:     ts.abstract,
			Tags:         ts.tags,
			CoAuthors:    coAuthors,
			Keywords:     keywords,
			AuthorEmail:  emailPtr,
			University:   univPtr,
			Status:       ts.status,
		}

		if ts.status == "approved" && ts.roomIdx < len(roomIDs) {
			roomID := roomIDs[ts.roomIdx]
			talk.RoomID = &roomID
			st := time.Date(2026, 10, 20, ts.startHour, ts.startMin, 0, 0, loc)
			et := time.Date(2026, 10, 20, ts.endHour, ts.endMin, 0, 0, loc)
			talk.StartTime = &st
			talk.EndTime = &et
		}

		if ts.status == "rejected" || ts.status == "needs_revision" {
			comment := "Пожалуйста, доработайте аннотацию и уточните методологию исследования."
			talk.JuryComment = &comment
		}

		if err := db.CreateTalk(ctx, talk); err != nil {
			return fmt.Errorf("create talk '%s': %w", ts.title, err)
		}
	}
	slog.Info("created talks", "count", len(talks))

	// ── AI result for one talk ───────────────
	allTalks, _ := db.ListTalks(ctx, conf.ID, nil, nil, nil, nil)
	if len(allTalks) > 0 {
		firstTalk := allTalks[0]
		existing, _ := db.GetLatestAIResult(ctx, firstTalk.ID)
		if existing == nil {
			aiData := models.AIResultData{
				DocumentChecked:    false,
				DocumentUnreadable: false,
				SectionFit:         &models.AIScore{Score: 85, Verdict: "fits", Comment: "Работа хорошо соответствует секции IT и ИИ."},
				AnnotationMatch:    nil,
				Issues:             []models.AIIssue{},
				Suggestions:        []string{"Добавьте описание используемых датасетов", "Укажите сравнение с другими методами"},
				OverallVerdict:     "ok",
				CreatedAt:          time.Now().In(loc),
			}

			resultJSON, _ := json.Marshal(aiData)
			aiResult := &models.AIResult{
				TalkID:    firstTalk.ID,
				AttemptNo: 1,
				Model:     "gemini-2.5-flash",
			}
			if err := json.Unmarshal(resultJSON, &aiResult.Result); err != nil {
				slog.Warn("failed to marshal AI result", "error", err)
			} else {
				aiResult.Result = aiData
				if err := db.CreateAIResult(ctx, aiResult); err != nil {
					slog.Warn("failed to create seed AI result", "error", err)
				} else {
					db.IncrementAIAttempts(ctx, firstTalk.ID)
					slog.Info("created AI result for talk", "talkId", firstTalk.ID)
				}
			}
		}
	}

	slog.Info("seed complete! Test credentials:",
		"admin", cfg.SeedAdminLogin+"/"+cfg.SeedAdminPassword,
		"jury", "jury1/jury123, jury2/jury123",
		"student", "student1/student123, student2/student123",
	)

	return nil
}

func strPtr(s string) *string {
	return &s
}

