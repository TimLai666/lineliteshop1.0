package services

import (
	"log"

	"github.com/line/line-bot-sdk-go/v8/linebot/messaging_api"
)

type LineService struct {
	bot *messaging_api.MessagingApiAPI
}

func NewLineService(bot *messaging_api.MessagingApiAPI) *LineService {
	return &LineService{
		bot: bot,
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
