package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"lineliteshop1.0/internal/google_sheet"
	"lineliteshop1.0/internal/models"
)

func (h *Handler) HandleGetCategories(c *gin.Context) {
	// 呼叫 Google Sheet API 獲取商品分類資料
	categories, err := google_sheet.GetCategories()
	if err != nil {
		log.Printf("獲取商品分類資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get categories"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Categories retrieved successfully",
		"data":    categories,
	})
}

func (h *Handler) HandleGetCategory(c *gin.Context) {
	categoryName := c.Param("name")
	if categoryName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category name is required"})
		return
	}

	// 呼叫 Google Sheet API 獲取特定商品分類資料
	category, err := google_sheet.GetCategoryByName(categoryName)
	if err != nil {
		log.Printf("獲取商品分類 %s 失敗: %v", categoryName, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Category retrieved successfully",
		"data":    category,
	})
}

func (h *Handler) HandleGetProducts(c *gin.Context) {
	// 呼叫 Google Sheet API 獲取商品資料
	products, err := google_sheet.GetProducts()
	if err != nil {
		log.Printf("獲取商品資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Products retrieved successfully",
		"data":    products,
	})
}

// HandleCustomerRegister 處理客戶註冊請求
func (h *Handler) HandleCustomerRegister(c *gin.Context) {
	customer := models.Customer{}
	if err := c.ShouldBindJSON(&customer); err != nil {
		log.Printf("解析客戶資料失敗: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// 呼叫 Google Sheet API 新增客戶資料
	if customer.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}
	err := google_sheet.AddCustomer(customer)
	if err != nil {
		log.Printf("新增客戶資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register customer"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Customer registered successfully",
	})
}

func (h *Handler) HandleUpdateCustomer(c *gin.Context) {
	customer := models.Customer{}
	if err := c.ShouldBindJSON(&customer); err != nil {
		log.Printf("解析客戶資料失敗: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if customer.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required for update"})
		return
	}

	// 呼叫 Google Sheet API 更新客戶資料
	err := google_sheet.UpdateCustomer(customer)
	if err != nil {
		log.Printf("更新客戶資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Customer updated successfully",
	})
}

func (h *Handler) HandleAddOrder(c *gin.Context) {
	order := models.Order{}
	if err := c.ShouldBindJSON(&order); err != nil {
		log.Printf("解析訂單資料失敗: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if order.CustomerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required for order"})
		return
	}
	if order.Products == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order must contain at least one product"})
		return
	}

	// 呼叫 Google Sheet API 新增訂單資料
	err := google_sheet.AddOrder(order)
	if err != nil {
		log.Printf("新增訂單資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add order"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Order added successfully",
	})
}

func (h *Handler) HandleUpdateOrder(c *gin.Context) {
	order := models.Order{}
	if err := c.ShouldBindJSON(&order); err != nil {
		log.Printf("解析訂單資料失敗: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if order.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is required for update"})
		return
	}

	// 呼叫 Google Sheet API 更新訂單資料
	err := google_sheet.UpdateOrder(order)
	if err != nil {
		log.Printf("更新訂單資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Order updated successfully",
	})
}
