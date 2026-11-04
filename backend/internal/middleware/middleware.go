package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"confapp/internal/auth"
	"confapp/internal/models"
	"confapp/internal/repo"
)

type contextKey string

const UserContextKey contextKey = "user"
const ClaimsContextKey contextKey = "claims"

// GetUser extracts the authenticated user from the Gin context or request context.
func GetUser(c *gin.Context) *models.User {
	if val, exists := c.Get(string(UserContextKey)); exists {
		if u, ok := val.(*models.User); ok {
			return u
		}
	}
	if u, ok := c.Request.Context().Value(UserContextKey).(*models.User); ok {
		return u
	}
	return nil
}

// GetClaims extracts JWT claims from the Gin context or request context.
func GetClaims(c *gin.Context) *auth.Claims {
	if val, exists := c.Get(string(ClaimsContextKey)); exists {
		if cl, ok := val.(*auth.Claims); ok {
			return cl
		}
	}
	if cl, ok := c.Request.Context().Value(ClaimsContextKey).(*auth.Claims); ok {
		return cl
	}
	return nil
}

// ── CORS ─────────────────────────────────────

func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowAll := false
	originSet := make(map[string]bool)
	for _, o := range allowedOrigins {
		if o == "*" {
			allowAll = true
		}
		originSet[o] = true
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowAll || originSet[origin] || originSet["*"] {
			if origin != "" {
				c.Header("Access-Control-Allow-Origin", origin)
			} else {
				c.Header("Access-Control-Allow-Origin", "*")
			}
			c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Header("Access-Control-Max-Age", "86400")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// ── Auth middleware ───────────────────────────

// Auth validates JWT and loads the user from the database.
func Auth(jwtSecret string, db *repo.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "токен не предоставлен")
			c.Abort()
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		claims, err := auth.ParseToken(tokenStr, jwtSecret)
		if err != nil {
			WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "недействительный токен")
			c.Abort()
			return
		}

		user, err := db.GetUserByID(c.Request.Context(), claims.UserID)
		if err != nil || user == nil {
			WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "пользователь не найден")
			c.Abort()
			return
		}

		if !user.IsActive {
			WriteError(c, http.StatusUnauthorized, "ACCOUNT_DISABLED", "аккаунт отключён")
			c.Abort()
			return
		}

		// Check token version to invalidate old tokens after password reset or deactivation
		if user.TokenVersion != claims.TokenVersion {
			WriteError(c, http.StatusUnauthorized, "UNAUTHORIZED", "токен отозван")
			c.Abort()
			return
		}

		c.Set(string(UserContextKey), user)
		c.Set(string(ClaimsContextKey), claims)

		ctx := context.WithValue(c.Request.Context(), UserContextKey, user)
		ctx = context.WithValue(ctx, ClaimsContextKey, claims)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// OptionalAuth tries to parse a Bearer token but doesn't fail if absent.
// If valid, the user is placed in context; if not, the request continues without a user.
func OptionalAuth(jwtSecret string, db *repo.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || len(header) < 8 || !strings.HasPrefix(header, "Bearer ") {
			c.Next()
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.ParseToken(tokenStr, jwtSecret)
		if err != nil {
			c.Next()
			return
		}

		user, err := db.GetUserByID(c.Request.Context(), claims.UserID)
		if err == nil && user != nil && user.IsActive && user.TokenVersion == claims.TokenVersion {
			c.Set(string(UserContextKey), user)
			c.Set(string(ClaimsContextKey), claims)

			ctx := context.WithValue(c.Request.Context(), UserContextKey, user)
			ctx = context.WithValue(ctx, ClaimsContextKey, claims)
			c.Request = c.Request.WithContext(ctx)
		}
		c.Next()
	}
}

// RequirePasswordChanged blocks endpoints when password change is required,
// except for /auth/me, /auth/change-password, /auth/logout.
func RequirePasswordChanged(c *gin.Context) {
	user := GetUser(c)
	if user != nil && user.MustChangePassword {
		path := c.Request.URL.Path
		if !strings.HasSuffix(path, "/auth/me") &&
			!strings.HasSuffix(path, "/auth/change-password") &&
			!strings.HasSuffix(path, "/auth/logout") {
			WriteError(c, http.StatusForbidden, "PASSWORD_CHANGE_REQUIRED", "необходимо сменить пароль")
			c.Abort()
			return
		}
	}
	c.Next()
}

// RequireConsent blocks student endpoints when consent is not given.
func RequireConsent(c *gin.Context) {
	user := GetUser(c)
	if user != nil && user.Role == "student" && user.ConsentGivenAt == nil {
		WriteError(c, http.StatusForbidden, "CONSENT_REQUIRED", "необходимо дать согласие на обработку данных")
		c.Abort()
		return
	}
	c.Next()
}

// RequireRole creates middleware that checks the user's role.
func RequireRole(roles ...string) gin.HandlerFunc {
	roleSet := make(map[string]bool)
	for _, r := range roles {
		roleSet[r] = true
	}
	return func(c *gin.Context) {
		user := GetUser(c)
		if user == nil || !roleSet[user.Role] {
			WriteError(c, http.StatusForbidden, "FORBIDDEN", "недостаточно прав")
			c.Abort()
			return
		}
		c.Next()
	}
}

// ── Rate limiter ─────────────────────────────

type rateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
}

type visitor struct {
	count    int
	lastSeen time.Time
}

var limiter = &rateLimiter{
	visitors: make(map[string]*visitor),
}

// RateLimit is a no-op middleware with all rate limits disabled.
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

// ── Request logger ───────────────────────────

func RequestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logger.Info("request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration", time.Since(start).String(),
			"ip", c.ClientIP(),
		)
	}
}

// ── Body limit ───────────────────────────────

func MaxBodySize(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}

// ── Error helpers ────────────────────────────

type APIError struct {
	Error ErrorBody `json:"error"`
}

type ErrorBody struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

// WriteError writes an API error response and aborts the request.
func WriteError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, APIError{
		Error: ErrorBody{Code: code, Message: message},
	})
}

// WriteErrorWithFields writes an error with field-level details and aborts the request.
func WriteErrorWithFields(c *gin.Context, status int, code, message string, fields map[string]string) {
	c.AbortWithStatusJSON(status, APIError{
		Error: ErrorBody{Code: code, Message: message, Fields: fields},
	})
}

// WriteJSON writes a JSON response.
func WriteJSON(c *gin.Context, status int, data interface{}) {
	c.JSON(status, data)
}
