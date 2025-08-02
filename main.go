package main

import (
	"log"
	"net/http"

	"lineliteshop1.0/internal/config"
	"lineliteshop1.0/internal/handlers"
	"lineliteshop1.0/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/line/line-bot-sdk-go/v8/linebot/messaging_api"
)

func main() {
	// 初始化 LINE Bot Messaging API 客戶端
	client := &http.Client{}
	bot, err := messaging_api.NewMessagingApiAPI(
		config.LINE_CHANNEL_TOKEN,
		messaging_api.WithHTTPClient(client),
	)
	if err != nil {
		log.Fatal(err)
	}

	// 初始化處理器 (內部會自動初始化服務層)
	handler := handlers.NewHandler(bot)

	// 初始化 Gin 路由器 (使用預設中間件)
	r := gin.Default()

	// 設定路由
	routes.SetupRoutes(r, handler)

	// 啟動 Gin 伺服器
	log.Println("伺服器啟動於 127.0.0.1:10100 端口")
	log.Fatal(r.Run("127.0.0.1:10100"))
}
