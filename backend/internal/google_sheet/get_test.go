package google_sheet

import "testing"

func TestParseCustomerParsesDemographics(t *testing.T) {
	itemMap := map[string]any{
		"id":             "U123",
		"name":           "Tim Lai",
		"email":          "tim@example.com",
		"phone":          "0912345678",
		"birthday":       "2004-01-02",
		"occupation":     "工程師",
		"gender":         "男",
		"income_range":   "50,000-69,999",
		"household_size": "3人",
	}

	customer, err := parseCustomer(itemMap)
	if err != nil {
		t.Fatalf("parseCustomer returned error: %v", err)
	}

	if customer.ID != "U123" {
		t.Fatalf("expected ID U123, got %q", customer.ID)
	}
	if customer.Email != "tim@example.com" {
		t.Fatalf("expected email tim@example.com, got %q", customer.Email)
	}
	if customer.Occupation != "工程師" {
		t.Fatalf("expected occupation 工程師, got %q", customer.Occupation)
	}
	if customer.Gender != "男" {
		t.Fatalf("expected gender 男, got %q", customer.Gender)
	}
	if customer.IncomeRange != "50,000-69,999" {
		t.Fatalf("expected income range 50,000-69,999, got %q", customer.IncomeRange)
	}
	if customer.HouseholdSize != "3人" {
		t.Fatalf("expected household size 3人, got %q", customer.HouseholdSize)
	}
}
