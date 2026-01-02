package handlers

import (
	"net/http"

	"github.com/HazelnutParadise/insyra"
	"github.com/HazelnutParadise/insyra/mkt"
	"github.com/HazelnutParadise/insyra/parallel"
	"github.com/gin-gonic/gin"
)

// TODO: RFM, CAI, 購物籃
func (h *Handler) HandleCalculate(c *gin.Context) {
	t := c.Param("type")
	var jsonData map[string]any
	if err := c.ShouldBindJSON(&jsonData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	} else if len(jsonData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No json data provided"})
		return
	}

	data := jsonData["data"].([]any)
	var data2d [][]any
	for _, row := range data {
		data2d = append(data2d, row.([]any))
	}
	dataTable, err := insyra.Slice2DToDataTable(data2d)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dataTable.SetRowToColNames(0)

	config := jsonData["config"].(map[string]any)

	switch t {
	// TODO: Implement 購物籃 calculation
	case "rfm":
		customerIDColName, okCustomerIDColName := config["customerIDColName"].(string)
		tradingDayColName, okTradingDayColName := config["tradingDayColName"].(string)
		amountColName, okAmountColName := config["amountColName"].(string)
		if !okCustomerIDColName || !okTradingDayColName || !okAmountColName || customerIDColName == "" || tradingDayColName == "" || amountColName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing config parameters"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"RFM": mkt.RFM(dataTable, mkt.RFMConfig{
				CustomerIDColName: customerIDColName,
				TradingDayColName: tradingDayColName,
				AmountColName:     amountColName,
				TimeScale:         mkt.TimeScaleDaily,
				DateFormat:        "yyyy/MM/dd HH:mm:ss",
				NumGroups:         2,
			}).ColNamesToFirstRow().To2DSlice(),
		})
	case "cai":
		customerIDColName, okCustomerIDColName := config["customerIDColName"].(string)
		tradingDayColName, okTradingDayColName := config["tradingDayColName"].(string)
		if !okCustomerIDColName || !okTradingDayColName || customerIDColName == "" || tradingDayColName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing config parameters"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"CAI": mkt.CAI(dataTable, mkt.CAIConfig{
				CustomerIDColName: customerIDColName,
				TradingDayColName: tradingDayColName,
				TimeScale:         mkt.TimeScaleDaily,
				DateFormat:        "yyyy/MM/dd HH:mm:ss",
			}).ColNamesToFirstRow().To2DSlice(),
		})
	// case "basket":
	//
	//	return h.HandleBasket(c)
	case "all":
		// 平行計算全部
		customerIDColName, okCustomerIDColName := config["customerIDColName"].(string)
		tradingDayColName, okTradingDayColName := config["tradingDayColName"].(string)
		amountColName, okAmountColName := config["amountColName"].(string)
		if !okCustomerIDColName || !okTradingDayColName || !okAmountColName || customerIDColName == "" || tradingDayColName == "" || amountColName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing config parameters"})
			return
		}

		// 避免平行化時競爭
		customerIDColName_copy := customerIDColName
		tradingDayColName_copy := tradingDayColName
		var rfmResult, caiResult [][]any
		calcRFM := func() {
			rfmResult = mkt.RFM(dataTable, mkt.RFMConfig{
				CustomerIDColName: customerIDColName,
				TradingDayColName: tradingDayColName,
				AmountColName:     amountColName,
				TimeScale:         mkt.TimeScaleDaily,
				DateFormat:        "yyyy/MM/dd HH:mm:ss",
				NumGroups:         2,
			}).ColNamesToFirstRow().To2DSlice()
		}
		calcCAI := func() {
			caiResult = mkt.CAI(dataTable, mkt.CAIConfig{
				CustomerIDColName: customerIDColName_copy,
				TradingDayColName: tradingDayColName_copy,
				TimeScale:         mkt.TimeScaleDaily,
				DateFormat:        "yyyy/MM/dd HH:mm:ss",
			}).ColNamesToFirstRow().To2DSlice()
		}
		parallel.GroupUp(calcRFM, calcCAI).Run().AwaitNoResult()
		c.JSON(http.StatusOK, gin.H{
			"RFM": rfmResult,
			"CAI": caiResult,
		})
	default:
		// Set appropriate content type for Problem Details
		c.Header("Content-Type", "application/problem+json")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type"})
		return
	}
}
