package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	GeminiAPIKey       string
	GeminiModel        string
	CORSOrigins        []string
	UploadDir          string
	SeedAdminLogin     string
	SeedAdminPassword  string
	MaxTalksPerStudent int
	AIDailyLimit       int
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		Port:               envOrDefault("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		GeminiAPIKey:       os.Getenv("GEMINI_API_KEY"),
		GeminiModel:        envOrDefault("GEMINI_MODEL", "gemini-3.5-flash-lite"),
		UploadDir:          envOrDefault("UPLOAD_DIR", "./uploads"),
		SeedAdminLogin:     envOrDefault("SEED_ADMIN_LOGIN", "admin"),
		SeedAdminPassword:  envOrDefault("SEED_ADMIN_PASSWORD", "Admin123!"),
		MaxTalksPerStudent: envOrDefaultInt("MAX_TALKS_PER_STUDENT", 99999),
		AIDailyLimit:       envOrDefaultInt("AI_DAILY_LIMIT", 99999),
	}

	origins := os.Getenv("CORS_ORIGINS")
	if origins != "" {
		for _, o := range strings.Split(origins, ",") {
			cfg.CORSOrigins = append(cfg.CORSOrigins, strings.TrimSpace(o))
		}
	} else {
		cfg.CORSOrigins = []string{"http://localhost:5173"}
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envOrDefaultInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}
