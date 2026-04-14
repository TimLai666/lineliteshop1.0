package google_sheet

import "strings"

const (
	apiOrderStatusPending    = "pending"
	apiOrderStatusInProgress = "in_progress"
	apiOrderStatusCompleted  = "completed"
	apiOrderStatusCancelled  = "cancelled"
)

func normalizeOrderStatus(status string) string {
	normalized := strings.TrimSpace(strings.ToLower(status))
	if normalized == "" {
		return ""
	}

	switch normalized {
	case "pending", "待處理":
		return apiOrderStatusPending
	case "in_progress", "confirmed", "preparing", "進行中", "已確認", "製作中":
		return apiOrderStatusInProgress
	case "completed", "delivered", "已完成", "已送達":
		return apiOrderStatusCompleted
	case "cancelled", "取消", "已取消":
		return apiOrderStatusCancelled
	default:
		return strings.TrimSpace(status)
	}
}

func normalizeOutgoingOrderStatus(status string) string {
	normalized := normalizeOrderStatus(status)
	if normalized == "" {
		return ""
	}

	return normalized
}
