package handlers

import (
	"log"
	"net/http"
	"path/filepath"

	"lineliteshop1.0/internal/config"
	"lineliteshop1.0/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/line/line-bot-sdk-go/v8/linebot/messaging_api"
	"github.com/line/line-bot-sdk-go/v8/linebot/webhook"
)

type Handler struct {
	lineService *services.LineService
}

func NewHandler(bot *messaging_api.MessagingApiAPI) *Handler {
	lineService := services.NewLineService(bot)
	return &Handler{
		lineService: lineService,
	}
}

// HandleWebhook 處理 LINE Bot webhook 回調
func (h *Handler) HandleWebhook(c *gin.Context) {
	// 解析 LINE webhook 請求
	cb, err := webhook.ParseRequest(config.LINE_CHANNEL_SECRET, c.Request)
	if err != nil {
		log.Printf("解析 webhook 失敗: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	// 處理每一個 webhook 事件
	for _, event := range cb.Events {
		switch e := event.(type) {
		case webhook.MessageEvent:
			// 檢查是否為文字訊息
			if textMsg, ok := e.Message.(webhook.TextMessageContent); ok {
				// 處理文字訊息
				err := h.lineService.HandleTextMessage(e.ReplyToken, textMsg.Text)
				if err != nil {
					log.Printf("處理文字訊息失敗: %v", err)
				}
			}
		case webhook.StickerMessageContent:
			// 處理貼圖訊息
			log.Println("收到貼圖訊息")
		default:
			log.Printf("未處理的事件類型: %T", e)
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// HandleCustomerRegister 處理客戶註冊請求
func (h *Handler) HandleCustomerRegister(c *gin.Context) {
	// todo: 實現客戶註冊邏輯

}

// HealthCheck 健康檢查端點
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "LINE Bot is running",
	})
}

// ServeLIFF 提供LIFF前端靜態文件服務
func (h *Handler) ServeLIFF(c *gin.Context) {
	// 獲取請求的文件路徑
	filePath := c.Param("filepath")

	// 如果沒有指定文件路徑，默認提供 index.html
	if filePath == "" || filePath == "/" {
		filePath = "index.html"
	}

	// 構建完整的文件路徑
	fullPath := filepath.Join("liff", "dist", filePath)

	// 檢查文件是否存在
	if _, err := http.Dir(".").Open(fullPath); err != nil {
		// 如果文件不存在，返回 index.html (SPA 路由支持)
		c.File("liff/dist/index.html")
		return
	}

	// 提供靜態文件
	c.File(fullPath)
}

// SwitchUserRichMenu 切換使用者的 Rich Menu
func (h *Handler) SwitchUserRichMenu(c *gin.Context) {
	userId := c.Param("userId")
	richMenuId := c.Param("richMenuId")

	if userId == "" || richMenuId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "使用者ID和Rich Menu ID不能為空"})
		return
	}

	err := h.lineService.SwitchUserRichMenu(userId, richMenuId)
	if err != nil {
		log.Printf("切換 Rich Menu 失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "切換 Rich Menu 失敗"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "成功切換 Rich Menu",
		"userId":     userId,
		"richMenuId": richMenuId,
	})
}
