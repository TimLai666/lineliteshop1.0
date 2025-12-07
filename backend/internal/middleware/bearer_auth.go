package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// BearerAuthMiddleware 回傳一個 Gin middleware，使用預期的 token 來驗證 Authorization header。
// expectedToken: 你要比對的 token（例如從 config.GOOGLE_SHEET_API_TOKEN 傳入）。
func BearerAuthMiddleware(expectedToken string) gin.HandlerFunc {
	const bearerPrefix = "Bearer "

	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			c.Header("Content-Type", "application/problem+json")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			c.Abort()
			return
		}

		// 允許大小寫不敏感的 "Bearer " 前綴
		if len(auth) <= len(bearerPrefix) || !strings.EqualFold(auth[:len(bearerPrefix)], bearerPrefix) {
			c.Header("Content-Type", "application/problem+json")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format"})
			c.Abort()
			return
		}

		// 取出 token（保留原始大小寫）
		token := auth[len(bearerPrefix):]
		if len(token) == 0 {
			c.Header("Content-Type", "application/problem+json")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Empty bearer token"})
			c.Abort()
			return
		}

		if token != expectedToken {
			c.Header("Content-Type", "application/problem+json")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// token 驗證成功，繼續處理
		c.Next()
	}
}
