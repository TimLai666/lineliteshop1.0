package google_sheet

import "testing"

func TestNormalizeOrderStatus(t *testing.T) {
	tests := map[string]string{
		"pending":   apiOrderStatusPending,
		"待處理":       apiOrderStatusPending,
		"confirmed": apiOrderStatusInProgress,
		"preparing": apiOrderStatusInProgress,
		"進行中":       apiOrderStatusInProgress,
		"已確認":       apiOrderStatusInProgress,
		"製作中":       apiOrderStatusInProgress,
		"completed": apiOrderStatusCompleted,
		"delivered": apiOrderStatusCompleted,
		"已完成":       apiOrderStatusCompleted,
		"已送達":       apiOrderStatusCompleted,
		"cancelled": apiOrderStatusCancelled,
		"取消":        apiOrderStatusCancelled,
		"已取消":       apiOrderStatusCancelled,
		" custom ":  "custom",
		"":          "",
	}

	for input, expected := range tests {
		if actual := normalizeOrderStatus(input); actual != expected {
			t.Fatalf("normalizeOrderStatus(%q) = %q, want %q", input, actual, expected)
		}
	}
}
