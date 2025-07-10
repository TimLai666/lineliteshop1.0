package routes

import (
	"lineliteshop1.0/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 設定所有路由
func SetupRoutes(r *gin.Engine, handler *handlers.Handler) {
	// 健康檢查端點
	r.GET("/", handler.HealthCheck)

	// 測試頁面
	r.StaticFile("/test", "./test-page.html")

	apiGroup := r.Group("/api")
	{
		// LINE Bot webhook 回調端點
		apiGroup.POST("/callback", handler.HandleWebhook)

		// Rich Menu 控制端點 - 簡單的切換功能
		apiGroup.POST("/richmenu/switch/:userId/:richMenuId", handler.SwitchUserRichMenu) // 切換使用者的 Rich Menu

		apiDataGroup := apiGroup.Group("/data")
		{
			// categories
			apiDataGroup.GET("/category/:name", handler.HandleGetCategory)
			apiDataGroup.GET("/categories", handler.HandleGetCategories)

			// products
			apiDataGroup.GET("/products", handler.HandleGetProducts)

			// customer
			apiDataGroup.GET("/customer/:id", handler.HandleGetCustomer)
			apiDataGroup.GET("/customers", handler.HandleGetCustomers)
			apiDataGroup.POST("/customer", handler.HandleCustomerRegister)
			apiDataGroup.PUT("/customer", handler.HandleUpdateCustomer)

			// order
			apiDataGroup.GET("/order/:id", handler.HandleGetOrder)
			apiDataGroup.GET("/orders", handler.HandleGetOrders)
			apiDataGroup.POST("/order", handler.HandlePostOrder)
			apiDataGroup.PUT("/order", handler.HandleUpdateOrder)
		}
	}

	// LIFF 前端應用服務
	// 提供靜態文件服務，支援 SPA 路由
	r.Static("/liff/assets", "./liff/dist/assets")         // 靜態資源（CSS, JS等）
	r.StaticFile("/liff/vite.svg", "./liff/dist/vite.svg") // Vite 圖標
	r.GET("/liff", handler.ServeLIFF)                      // LIFF 應用首頁
	r.NoRoute(handler.ServeLIFF)                           // 處理所有未匹配的路由，用於 SPA 路由
}
