package google_sheet

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"

	"lineliteshop1.0/internal/config"
	"lineliteshop1.0/internal/models"
)

type apiPostReqData struct {
	Token  string `json:"token"`
	Action string `json:"action"`
	Data   any    `json:"data"`
}

type apiPostResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func AddCustomer(customer models.Customer) error {
	if customer.ID == "" {
		return errors.New("customer ID is required")
	}

	// 呼叫 Google Sheet API 來新增客戶資料
	return callPostApi("ADD_CUSTOMER", customer)
}

func callPostApi(action string, data any) error {
	reqData := apiPostReqData{
		Token:  config.GOOGLE_SHEET_API_TOKEN,
		Action: action,
		Data:   data,
	}

	j, err := json.Marshal(reqData)
	if err != nil {
		return err
	}

	res, err := http.Post(config.GOOGLE_SHEET_API_URL, "application/json", bytes.NewBuffer(j))
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return errors.New("failed to post, status code: " + res.Status)
	}

	var response apiPostResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return err
	}
	if response.Status != "success" {
		return errors.New("failed to post: " + response.Message)
	}
	return nil
}
