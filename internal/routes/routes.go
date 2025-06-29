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

	// LIFF 前端應用服務
	// 提供靜態文件服務，支援 SPA 路由
	r.Static("/assets", "./liff/dist/assets")         // 靜態資源（CSS, JS等）
	r.StaticFile("/vite.svg", "./liff/dist/vite.svg") // Vite 圖標
	r.GET("/liff", handler.ServeLIFF)                 // LIFF 應用首頁
	r.GET("/liff/*filepath", handler.ServeLIFF)       // LIFF 應用的所有路由
}
