package handler

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"confapp/internal/middleware"
	"confapp/internal/repo"
)

// NewRouter creates the Gin engine with all routes configured.
func NewRouter(h *Handler, jwtSecret string, db *repo.DB, corsOrigins []string) http.Handler {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	// ── Global middleware ─────────────────────
	r.Use(middleware.RequestLogger(h.logger))
	r.Use(middleware.CORS(corsOrigins))
	r.Use(middleware.MaxBodySize(11 * 1024 * 1024)) // 11 MB (10 for upload + overhead)

	// ── Swagger UI & OpenAPI ─────────────────
	r.GET("/openapi.yaml", func(c *gin.Context) {
		if _, err := os.Stat("openapi.yaml"); err == nil {
			c.File("openapi.yaml")
			return
		}
		c.File("/openapi.yaml")
	})
	r.GET("/docs", func(c *gin.Context) {
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, swaggerUIHTML)
	})

	// ── Public routes (no auth) ──────────────
	r.GET("/api/health", h.Health)

	r.GET("/api/conferences", h.ListConferences)
	r.GET("/api/conferences/current", h.GetCurrentConference)
	r.GET("/api/sections", h.ListSections)
	r.GET("/api/rooms", h.ListRooms)

	// Public talks listing — tries auth optionally for jury/admin status filter
	pubTalks := r.Group("")
	pubTalks.Use(middleware.OptionalAuth(jwtSecret, db))
	{
		pubTalks.GET("/api/conferences/:id/talks", h.ListConferenceTalks)
		pubTalks.GET("/api/talks/:id", h.GetTalk)
	}

	// ── Auth routes ──────────────────────────
	r.POST("/api/auth/login", h.Login)
	r.POST("/api/auth/register", h.Register)

	// ── Authenticated routes ─────────────────
	authed := r.Group("")
	authed.Use(middleware.Auth(jwtSecret, db))
	{
		// These always work even with must_change_password
		authed.GET("/api/auth/me", h.Me)
		authed.POST("/api/auth/change-password", h.ChangePassword)

		// Everything below requires password changed
		withPW := authed.Group("")
		withPW.Use(middleware.RequirePasswordChanged)
		{
			// ── Shared talk routes ───────────
			withPW.POST("/api/talks/:id/validate", h.ValidateTalk)
			withPW.GET("/api/talks/:id/ai-result", h.GetAIResult)
			withPW.GET("/api/talks/:id/document", h.DownloadDocument)
			withPW.GET("/api/talks/:id/presentation", h.DownloadPresentation)

			// ── Student routes ───────────────
			student := withPW.Group("")
			student.Use(middleware.RequireRole("student", "admin"))
			student.Use(middleware.RequireConsent)
			{
				student.GET("/api/my/talks", h.ListMyTalks)
				student.GET("/api/my/talks/:id", h.GetMyTalk)
				student.POST("/api/talks", h.CreateTalk)
				student.PATCH("/api/my/talks/:id", h.UpdateMyTalk)
				student.DELETE("/api/my/talks/:id", h.DeleteMyTalk)
				student.POST("/api/talks/:id/document", h.UploadDocument)
				student.POST("/api/talks/:id/presentation", h.UploadPresentation)
			}

			// ── Jury routes ──────────────────
			jury := withPW.Group("")
			jury.Use(middleware.RequireRole("jury", "admin"))
			{
				jury.GET("/api/jury/talks/:id", h.GetJuryTalk)
				jury.GET("/api/jury/talks/:id/document", h.DownloadDocument)
				jury.GET("/api/jury/talks/:id/presentation", h.DownloadPresentation)
				jury.PATCH("/api/jury/talks/:id/review", h.ReviewTalk)
			}

			// ── Admin routes ─────────────────
			admin := withPW.Group("")
			admin.Use(middleware.RequireRole("admin"))
			{
				// Users
				admin.POST("/api/admin/users", h.AdminCreateUser)
				admin.POST("/api/admin/users/import", h.AdminImportUsers)
				admin.GET("/api/admin/users", h.AdminListUsers)
				admin.PATCH("/api/admin/users/:id", h.AdminUpdateUser)
				admin.POST("/api/admin/users/:id/reset-password", h.AdminResetPassword)

				// Conferences
				admin.POST("/api/admin/conferences", h.AdminCreateConference)
				admin.PATCH("/api/admin/conferences/:id", h.AdminUpdateConference)
				admin.DELETE("/api/admin/conferences/:id", h.AdminDeleteConference)

				// Sections
				admin.POST("/api/admin/sections", h.AdminCreateSection)
				admin.PATCH("/api/admin/sections/:id", h.AdminUpdateSection)
				admin.DELETE("/api/admin/sections/:id", h.AdminDeleteSection)

				// Rooms
				admin.POST("/api/admin/rooms", h.AdminCreateRoom)
				admin.PATCH("/api/admin/rooms/:id", h.AdminUpdateRoom)
				admin.DELETE("/api/admin/rooms/:id", h.AdminDeleteRoom)

				// Talks
				admin.DELETE("/api/admin/talks/:id", h.AdminDeleteTalk)

				// AI
				admin.POST("/api/admin/talks/:id/reset-ai-attempts", h.AdminResetAIAttempts)
			}
		}
	}

	return r
}

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>ConfApp API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`

