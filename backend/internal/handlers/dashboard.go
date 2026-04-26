package handlers

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// NewDashboardProxy 建立反向代理至 Streamlit 儀表板。
// httputil.ReverseProxy 預設支援 WebSocket Upgrade，
// 因此 Streamlit 的 /_stcore/stream 連線可以正常運作。
func NewDashboardProxy(targetURL string) (gin.HandlerFunc, error) {
	u, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(u)

	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}, nil
}
