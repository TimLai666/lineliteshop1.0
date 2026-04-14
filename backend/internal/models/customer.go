package models

type Customer struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	Birthday      string `json:"birthday"`
	Occupation    string `json:"occupation"`
	Gender        string `json:"gender"`
	IncomeRange   string `json:"income_range"`
	HouseholdSize string `json:"household_size"`
}
