package routes

import (
	"lineliteshop1.0/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 設定所有路由
func SetupRoutes(r *gin.Engine, handler *handlers.Handler) {
	// 健康檢查端點
	r.GET("/", handler.HealthCheck)

	apiGroup := r.Group("/api")
	{
		// LINE Bot webhook 回調端點
		apiGroup.POST("/callback", handler.HandleWebhook)
		apiGroup.POST("/customer-register", handler.HandleCustomerRegister)

		// Rich Menu 控制端點 - 簡單的切換功能
		apiGroup.POST("/richmenu/switch/:userId/:richMenuId", handler.SwitchUserRichMenu) // 切換使用者的 Rich Menu

		apiDataGroup := apiGroup.Group("/data")
		{
			// customer
			apiDataGroup.POST("/customer", handler.HandleCustomerRegister)
			apiDataGroup.PUT("/customer", handler.HandleUpdateCustomer)

			// order
			apiDataGroup.POST("/order", handler.HandleAddOrder)
		}
	}

	// LIFF 前端應用服務
	// 提供靜態文件服務，支援 SPA 路由
	r.Static("/assets", "./liff/dist/assets")         // 靜態資源（CSS, JS等）
	r.StaticFile("/vite.svg", "./liff/dist/vite.svg") // Vite 圖標
	r.GET("/liff", handler.ServeLIFF)                 // LIFF 應用首頁
	r.GET("/liff/*filepath", handler.ServeLIFF)       // LIFF 應用的所有路由
}
