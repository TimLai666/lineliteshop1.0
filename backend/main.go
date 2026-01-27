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

	// 建立 Blob client（與 Messaging API 共用相同的 channel token）
	blobClient, err := messaging_api.NewMessagingApiBlobAPI(config.LINE_CHANNEL_TOKEN)
	if err != nil {
		log.Printf("建立 blob client 失敗: %v", err)
		blobClient = nil
	}

	// 初始化處理器 (將 bot 與 blobClient 傳入服務層)
	handler := handlers.NewHandler(bot, blobClient)

	// 初始化 Gin 路由器 (使用預設中間件)
	r := gin.Default()

	// 設定路由
	routes.SetupRoutes(r, handler)

	// 啟動 Gin 伺服器
	log.Println("伺服器啟動於 :10100 端口")
	log.Fatal(r.Run(":10100"))
}
