package handlers

import (
	"net/http"

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

	// dataTable := insyra.NewDataTable()

	switch t {
	// case "rfm":
	//
	//	return h.HandleRFM(c)
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
