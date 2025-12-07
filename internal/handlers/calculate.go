package handlers

import (
	"net/http"

	"github.com/HazelnutParadise/insyra"
	"github.com/HazelnutParadise/insyra/mkt"
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

	dataTable, err := insyra.Slice2DToDataTable(jsonData["data"])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config := jsonData["config"].(map[string]any)

	switch t {
	// TODO: Implement RFM calculation
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
			}).ColNamesToFirstRow().To2DSlice(),
		})
	//
	// case "cai":
	//
	//	return h.HandleCAI(c)
	//
	// case "basket":
	//
	//	return h.HandleBasket(c)
	default:
		// Set appropriate content type for Problem Details
		c.Header("Content-Type", "application/problem+json")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type"})
		return
	}
}
