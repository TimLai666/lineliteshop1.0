package handlers

import (
	"log"
	"net/http"

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

// HealthCheck 健康檢查端點
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "LINE Bot is running",
	})
}

// GetRichMenu Rich Menu 管理端點（預留）
func (h *Handler) GetRichMenu(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Rich Menu management endpoint",
	})
}
