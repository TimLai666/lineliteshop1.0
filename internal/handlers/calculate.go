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
	var data []any
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	} else if len(data) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No data provided"})
		return
	}

	dataTable, err := insyra.Slice2DToDataTable(data)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	switch t {
	// TODO: Implement RFM calculation
	case "rfm":
		c.Data(http.StatusOK, "application/json", mkt.RFM(dataTable, mkt.RFMConfig{
			CustomerIDColName: "TODO",
			TradingDayColName: "TODO",
			AmountColName:     "TODO",
			TimeScale:         mkt.TimeScaleDaily,
			DateFormat:        "yyyy/MM/dd HH:mm:ss",
		}).ToJSON_Bytes(true))
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
