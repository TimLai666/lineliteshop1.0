package main

import (
	"fmt"
	"log"
	"net/http"

	"lineliteshop1.0/internal/config"

	"github.com/line/line-bot-sdk-go/v8/linebot/messaging_api"
)

func main() {
	client := &http.Client{}
	bot, err := messaging_api.NewMessagingApiAPI(
		config.LINE_CHANNEL_TOKEN,
		messaging_api.WithHTTPClient(client),
	)
	if err != nil {
		log.Fatal(err)
	}

	// todo: rich menu管理
	_ = bot

	// 設定 webhook 處理的路由
	// http.HandleFunc("/callback", func(w http.ResponseWriter, req *http.Request) {
	// 	// 解析 webhook 事件
	// 	cb, err := webhook.ParseRequest(config.LINE_CHANNEL_SECRET, req)
	// 	if err != nil {
	// 		log.Printf("解析 webhook 失敗: %v", err)
	// 		http.Error(w, "Bad Request", http.StatusBadRequest)
	// 		return
	// 	}

	// 	// 處理每一個事件
	// 	for _, event := range cb.Events {
	// 		switch e := event.(type) {
	// 		case webhook.MessageEvent:
	// 			replyMessage, err := service.AskInfo(e.Message.(webhook.TextMessageContent).Text)
	// 			if err != nil {
	// 				log.Printf("LLM 請求失敗: %v", err)
	// 				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	// 				return
	// 			}

	// 			bot.ReplyMessage(&messaging_api.ReplyMessageRequest{
	// 				ReplyToken: e.ReplyToken,
	// 				Messages: []messaging_api.MessageInterface{
	// 					messaging_api.TextMessage{
	// 						Text: replyMessage,
	// 					},
	// 				},
	// 			})
	// 		case webhook.StickerMessageContent:
	// 			// Do Something...
	// 		}
	// 	}
	// })

	// 啟動 HTTP 伺服器
	fmt.Println("伺服器啟動於 :8081 端口")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
