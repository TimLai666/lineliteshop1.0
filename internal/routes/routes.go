package routes

import (
	"lineliteshop1.0/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 設定所有路由
func SetupRoutes(r *gin.Engine, handler *handlers.Handler) {
	// LINE Bot webhook 回調端點
	r.POST("/callback", handler.HandleWebhook)

	// 健康檢查端點
	r.GET("/health", handler.HealthCheck)

	// Rich Menu 管理端點
	r.GET("/richmenu", handler.GetRichMenu)
}
