package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type pushMessageRequest struct {
	UserID               string `json:"userId" binding:"required"`
	Message              string `json:"message" binding:"required"`
	NotificationDisabled bool   `json:"notificationDisabled"`
}

func (h *Handler) HandlePushMessage(c *gin.Context) {
	var req pushMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.UserID == "" || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId and message are required"})
		return
	}

	if err := h.lineService.PushTextMessage(req.UserID, req.Message, req.NotificationDisabled); err != nil {
		log.Printf("push message failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to push message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Push message sent",
		"userId":  req.UserID,
	})
}
