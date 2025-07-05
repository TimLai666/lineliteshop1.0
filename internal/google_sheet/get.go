package google_sheet

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/HazelnutParadise/Go-Utils/asyncutil"
	"lineliteshop1.0/internal/config"
	"lineliteshop1.0/internal/models"
)

type apiGetResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    []any  `json:"data"`
}

func GetCategoryByName(name string) (*models.Category, error) {
	categories, err := GetCategories()
	if err != nil {
		return nil, err
	}
	for _, category := range categories {
		if category.Name == name {
			return &category, nil
		}
	}
	return nil, errors.New("category not found")
}

func GetCategories() ([]models.Category, error) {
	// 呼叫 Google Sheet API 來獲取商品分類資料
	apiResponse, err := callGetApi("CATEGORIES")
	if err != nil {
		return nil, err
	}

	if apiResponse.Data == nil {
		return nil, nil
	}

	categories := make([]models.Category, 0, len(apiResponse.Data))
	for _, item := range apiResponse.Data {
		itemMap, ok := item.(map[string]any)
		if !ok {
			return nil, errors.New("invalid item format in category data")
		}

		category, err := parseCategory(itemMap)
		if err != nil {
			return nil, err
		}

		categories = append(categories, *category)
	}

	return categories, nil
}

// parseCategory 解析單個分類項目
func parseCategory(itemMap map[string]any) (*models.Category, error) {
	name, ok := itemMap["name"].(string)
	if !ok {
		return nil, errors.New("invalid name format in category data")
	}

	description := ""
	if desc := itemMap["description"]; desc != nil {
		if d, ok := desc.(string); ok {
			description = d
		} else {
			return nil, errors.New("invalid description format in category data")
		}
	}

	isActive, ok := itemMap["is_active"].(bool)
	if !ok {
		return nil, errors.New("invalid is_active format in category data")
	}

	return &models.Category{
		Name:        name,
		Description: description,
		IsActive:    isActive,
	}, nil
}

func GetProducts() ([]models.Product, error) {
	// 呼叫 Google Sheet API 來獲取商品資料
	apiResponse, err := callGetApi("PRODUCTS")
	if err != nil {
		return nil, err
	}

	if apiResponse.Data == nil {
		return nil, nil
	}

	products := make([]models.Product, 0, len(apiResponse.Data))
	for _, item := range apiResponse.Data {
		itemMap, ok := item.(map[string]any)
		if !ok {
			return nil, errors.New("invalid item format in product data")
		}

		product, err := parseProduct(itemMap)
		if err != nil {
			return nil, err
		}

		products = append(products, *product)
	}

	return products, nil
}

// parseProduct 解析單個商品項目
func parseProduct(itemMap map[string]any) (*models.Product, error) {
	name, ok := itemMap["name"].(string)
	if !ok {
		return nil, errors.New("invalid name format in product data")
	}

	category := ""
	if cat, exists := itemMap["category"]; exists {
		if c, ok := cat.(string); ok {
			category = c
		} else {
			return nil, errors.New("invalid category format in product data")
		}
	}

	var priceF64 float64
	switch price := itemMap["price"].(type) {
	case float64:
		// 正常情況下的價格格式
		priceF64 = price
	case int:
		// 如果價格是整數格式，轉換為浮點數
		priceF64 = float64(price)
	case string:
		// 如果價格是字符串格式，嘗試轉換為浮點數
		var err error
		if price == "" {
			priceF64 = 0.0 // 如果價格為空字符串，則設置為 0
		} else {
			priceF64, err = strconv.ParseFloat(price, 64)
			if err != nil {
				return nil, errors.New("invalid price format in product data")
			}
		}
	default:
		return nil, errors.New("invalid price format in product data")
	}

	var stockInt int
	switch stock := itemMap["stock"].(type) {
	case float64:
		// 正常情況下的庫存格式
		stockInt = int(stock)
	case int:
		// 如果庫存是整數格式，直接使用
		stockInt = stock
	case string:
		// 如果庫存是字符串格式，嘗試轉換為整數
		var err error
		if stock == "" {
			stockInt = 0 // 如果庫存為空字符串，則設置為 0
		} else {
			stockInt, err = strconv.Atoi(stock)
			if err != nil {
				return nil, errors.New("invalid stock format in product data")
			}
		}
	default:
		return nil, errors.New("invalid stock format in product data")
	}

	status, ok := itemMap["status"].(string)
	if !ok {
		return nil, errors.New("invalid status format in product data")
	}

	description := ""
	if desc, exists := itemMap["description"]; exists {
		if d, ok := desc.(string); ok {
			description = d
		} else {
			return nil, errors.New("invalid description format in product data")
		}
	}

	return &models.Product{
		Name:        name,
		Category:    category,
		Price:       priceF64,
		Stock:       stockInt,
		Status:      status,
		Description: description,
	}, nil
}

func GetCustomerByID(id string) (*models.Customer, error) {
	// 呼叫 Google Sheet API 來獲取客戶資料
	apiResponse, err := callGetApi("CUSTOMERS")
	if err != nil {
		return nil, err
	}

	if apiResponse.Data == nil {
		return nil, nil
	}

	var customer *models.Customer
	asyncutil.ParallelForEach(apiResponse.Data, func(_, item any) {
		itemMap, ok := item.(map[string]any)
		if !ok {
			return
		}

		c, err := parseCustomer(itemMap)
		if err != nil {
			return
		}

		if c.ID == id {
			customer = c // 找到匹配的客戶，將其設置為結果
			return       // 找到後可以提前退出
		}
	})
	// for _, item := range apiResponse.Data {
	// 	itemMap, ok := item.(map[string]any)
	// 	if !ok {
	// 		return nil, errors.New("invalid item format in customer data")
	// 	}

	// 	customer, err := parseCustomer(itemMap)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	if customer.ID == id {
	// 		return customer, nil
	// 	}
	// }

	if customer != nil {
		return customer, nil
	}
	return nil, errors.New("customer not found")
}

func GetCustomers() ([]models.Customer, error) {
	// 呼叫 Google Sheet API 來獲取客戶資料
	apiResponse, err := callGetApi("CUSTOMERS")
	if err != nil {
		return nil, err
	}

	if apiResponse.Data == nil {
		return nil, nil
	}

	customers := make([]models.Customer, 0, len(apiResponse.Data))
	for _, item := range apiResponse.Data {
		itemMap, ok := item.(map[string]any)
		if !ok {
			return nil, errors.New("invalid item format in customer data")
		}

		customer, err := parseCustomer(itemMap)
		if err != nil {
			return nil, err
		}

		customers = append(customers, *customer)
	}

	return customers, nil
}

// parseCustomer 解析單個客戶項目
func parseCustomer(itemMap map[string]any) (*models.Customer, error) {
	// ID 是必填欄位
	id, ok := itemMap["id"].(string)
	if !ok {
		return nil, errors.New("invalid id format in customer data")
	}

	// 其他欄位為選填，如果不存在或格式錯誤則設為空字串
	name := ""
	if nameVal, exists := itemMap["name"]; exists {
		if n, ok := nameVal.(string); ok {
			name = n
		}
	}

	email := ""
	if emailVal, exists := itemMap["email"]; exists {
		if e, ok := emailVal.(string); ok {
			email = e
		}
	}

	phone := ""
	if phoneVal, exists := itemMap["phone"]; exists {
		if p, ok := phoneVal.(string); ok {
			phone = p
		}
	}

	birthday := ""
	if birthdayVal, exists := itemMap["birthday"]; exists {
		birthday = parseDate(birthdayVal)
	}

	return &models.Customer{
		ID:       id,
		Name:     name,
		Email:    email,
		Phone:    phone,
		Birthday: birthday,
	}, nil
}

// parseBirthday 解析生日欄位，處理時區轉換問題
func parseDate(dateVal any) string {
	switch v := dateVal.(type) {
	case string:
		// 如果已經是字串格式，直接返回
		if v == "" {
			return ""
		}

		// 嘗試解析各種可能的日期格式
		formats := []string{
			"2006-01-02T15:04:05.000Z", // ISO 8601 格式
			"2006-01-02T15:04:05Z",     // ISO 8601 簡化格式
			"2006-01-02",               // 日期格式
			"2006/01/02",               // 斜線分隔
			"1990/1/1",                 // 單數字月日
		}

		for _, format := range formats {
			if t, err := time.Parse(format, v); err == nil {
				// 轉換到台灣時區 (UTC+8)
				taiwanLocation, _ := time.LoadLocation("Asia/Taipei")
				taiwanTime := t.In(taiwanLocation)
				return taiwanTime.Format("2006-01-02")
			}
		}

		// 如果都解析失敗，返回原始字串
		return v

	case float64:
		// 如果是數字，可能是 Excel 的日期序列號
		// Excel 的日期從 1900-01-01 開始計算
		if v == 0 {
			return ""
		}

		// 將 Excel 日期序列號轉換為時間
		excelEpoch := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
		days := int(v)
		date := excelEpoch.AddDate(0, 0, days)

		// 轉換到台灣時區
		taiwanLocation, _ := time.LoadLocation("Asia/Taipei")
		taiwanTime := date.In(taiwanLocation)
		return taiwanTime.Format("2006-01-02")

	default:
		return ""
	}
}

func callGetApi(sheet string) (*apiGetResponse, error) {
	url := config.GOOGLE_SHEET_API_URL + "?token=" + config.GOOGLE_SHEET_API_TOKEN + "&sheet=" + sheet

	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var apiResponse apiGetResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return nil, err
	}
	if apiResponse.Status != "success" {
		return nil, errors.New(apiResponse.Message)
	}
	return &apiResponse, nil
}
