package google_sheet

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"lineliteshop1.0/internal/config"
	"lineliteshop1.0/internal/models"
)

type apiGetResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

func GetCategories() ([]models.Category, error) {
	// 呼叫 Google Sheet API 來獲取商品分類資料
	apiResponse, err := callGetApi("CATEGORIES")
	if err != nil {
		return nil, err
	}

	apiResponseData := apiResponse.Data
	if apiResponseData == nil {
		return nil, errors.New("no data found in API response")
	}

	fmt.Print("API Response Data: ", apiResponseData)
	categoryMap, ok := apiResponseData.([]any)
	if !ok {
		return nil, errors.New("invalid data format in API response")
	}
	categories := make([]models.Category, 0)
	for _, item := range categoryMap {
		itemMap, ok := item.(map[string]any)
		if !ok {
			return nil, errors.New("invalid item format in category data")
		}

		name, description, isActive := "", "", false

		name, ok = itemMap["name"].(string)
		if !ok {
			return nil, errors.New("invalid name format in category data")
		}

		if itemMap["description"] != nil {
			description, ok = itemMap["description"].(string)
			if !ok {
				return nil, errors.New("invalid description format in category data")
			}
		}

		isActive, ok = itemMap["is_active"].(bool)
		if !ok {
			return nil, errors.New("invalid is_active format in category data")
		}

		categories = append(categories, models.Category{
			Name:        name,
			Description: description,
			IsActive:    isActive,
		})
	}

	return categories, nil
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
