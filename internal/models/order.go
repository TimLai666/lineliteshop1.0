package models

type Order struct {
	ID           uint   `json:"id"`
	CustomerID   string `json:"customer_id"`
	CustomerName string `json:"customer_name"`
	Products     []Item `json:"products"`
	Status       string `json:"status"`
	Time         string `json:"time"`
	TotalAmount  int    `json:"total_amount"`
	CustomerNote string `json:"customer_note"`
	InternalNote string `json:"internal_note"`
}

type Item struct {
	Product  string `json:"product"`
	Quantity int    `json:"quantity"`
	Price    int    `json:"price"`
}
