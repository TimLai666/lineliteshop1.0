package google_sheet

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"lineliteshop1.0/internal/config"
	"lineliteshop1.0/internal/models"
)

type apiPostReqData struct {
	Token    string          `json:"token"`
	Action   string          `json:"action"`
	Customer models.Customer `json:"customer"`
	Order    models.Order    `json:"order"`
}

type apiPostResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func AddCustomer(customer models.Customer) error {
	// 呼叫 Google Sheet API 來新增客戶資料
	return callPostApi("ADD_CUSTOMER", customer)
}

func UpdateCustomer(customer models.Customer) error {
	// 呼叫 Google Sheet API 來更新客戶資料
	return callPostApi("UPDATE_CUSTOMER", customer)
}

func AddOrder(order models.Order) error {
	// 呼叫 Google Sheet API 來新增訂單資料
	return callPostApi("ADD_ORDER", order)
}

func UpdateOrder(order models.Order) error {
	// 呼叫 Google Sheet API 來更新訂單資料
	return callPostApi("UPDATE_ORDER", order)
}

func callPostApi(action string, data any) error {
	reqData := apiPostReqData{
		Token:  config.GOOGLE_SHEET_API_TOKEN,
		Action: action,
	}

	switch v := data.(type) {
	case models.Customer:
		reqData.Customer = v
	case models.Order:
		reqData.Order = v
	default:
		return errors.New("unsupported data type for Google Sheet API")
	}

	j, err := json.Marshal(reqData)
	if err != nil {
		return err
	}

	// 創建 HTTP 請求並設置必要的 headers
	req, err := http.NewRequest("POST", config.GOOGLE_SHEET_API_URL, bytes.NewBuffer(j))
	if err != nil {
		return err
	}

	// 設置必要的 HTTP headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("User-Agent", "LineLiteShop/1.0")

	// 執行請求
	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	// 先讀取完整的回應內容用於調試
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return errors.New("failed to read response body: " + err.Error())
	}

	if res.StatusCode != http.StatusOK {
		return errors.New("failed to post, status code: " + res.Status + ", body: " + string(body))
	}

	var response apiPostResponse
	if err := json.Unmarshal(body, &response); err != nil {
		// 如果無法解析 JSON，顯示實際收到的內容
		return errors.New("received non-JSON response: " + string(body))
	}
	if response.Status != "success" {
		return errors.New("failed to post: " + response.Message)
	}
	return nil
}
