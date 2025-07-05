package google_sheet

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"lineliteshop1.0/internal/config"
)

type apiGetResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    []any  `json:"data"`
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
