package services

import (
	"log"

	"github.com/line/line-bot-sdk-go/v8/linebot/messaging_api"
)

type LineService struct {
	bot        *messaging_api.MessagingApiAPI
	blobClient *messaging_api.MessagingApiBlobAPI
}

func NewLineService(bot *messaging_api.MessagingApiAPI) *LineService {
	// 嘗試建立 blob client，如果失敗就先設為 nil
	var blobClient *messaging_api.MessagingApiBlobAPI

	// 從環境變數或配置中取得 channel token
	// 這裡可以根據實際需求調整
	blobClient, err := messaging_api.NewMessagingApiBlobAPI("")
	if err != nil {
		log.Printf("建立 blob client 失敗: %v", err)
		blobClient = nil
	}

	return &LineService{
		bot:        bot,
		blobClient: blobClient,
	}
}

// HandleTextMessage 處理文字訊息
func (s *LineService) HandleTextMessage(replyToken, text string) error {
	// 這裡可以加入你的業務邏輯
	replyText := "收到訊息: " + text

	// 回覆訊息
	_, err := s.bot.ReplyMessage(&messaging_api.ReplyMessageRequest{
		ReplyToken: replyToken,
		Messages: []messaging_api.MessageInterface{
			messaging_api.TextMessage{
				Text: replyText,
			},
		},
	})
	if err != nil {
		log.Printf("回覆訊息失敗: %v", err)
		return err
	}

	return nil
}

// SwitchUserRichMenu 切換使用者的 Rich Menu
func (s *LineService) SwitchUserRichMenu(userId, richMenuId string) error {
	_, err := s.bot.LinkRichMenuIdToUser(userId, richMenuId)
	return err
}
