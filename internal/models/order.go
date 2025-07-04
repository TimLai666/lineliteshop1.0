package models

type Order struct {
	ID           uint   `json:"id"`
	CustomerID   string `json:"customer_id"`
	Products     []Item `json:"products"`
	CustomerNote string `json:"customer_note"`
	InternalNote string `json:"internal_note"`
}

type Item struct {
	Product  string `json:"product"`
	Quantity int    `json:"quantity"`
}
