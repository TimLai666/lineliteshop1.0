package handlers

import (
	"log"
	"net/http"
	"strconv"

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

func (h *Handler) HandleGetCustomers(c *gin.Context) {
	// 呼叫 Google Sheet API 獲取客戶資料
	customers, err := google_sheet.GetCustomers()
	if err != nil {
		log.Printf("獲取客戶資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customers"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Customers retrieved successfully",
		"data":    customers,
	})
}

func (h *Handler) HandleGetCustomer(c *gin.Context) {
	customerID := c.Param("id")
	if customerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	// 呼叫 Google Sheet API 獲取特定客戶資料
	customer, err := google_sheet.GetCustomerByID(customerID)
	if err != nil {
		// 檢查是否是 "customer not found" 錯誤
		if err.Error() == "customer not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		log.Printf("獲取客戶 %s 資料失敗: %v", customerID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get customer"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Customer retrieved successfully",
		"data":    customer,
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

func (h *Handler) HandleGetOrders(c *gin.Context) {
	userId := c.Param("lineUserId")
	orders, err := google_sheet.GetOrders()
	if err != nil {
		log.Printf("獲取訂單資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get orders"})
		return
	}
	// 如果有提供 userId，則過濾訂單
	for i, order := range orders {
		if order.CustomerID != userId {
			orders = append(orders[:i], orders[i+1:]...)
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Orders retrieved successfully",
		"data":    orders,
	})
}

func (h *Handler) HandleGetOrder(c *gin.Context) {
	orderID := c.Param("id")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is required"})
		return
	}

	orderIdInt, err := strconv.Atoi(orderID)
	if err != nil {
		log.Printf("無效的訂單 ID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// 呼叫 Google Sheet API 獲取特定訂單資料
	order, err := google_sheet.GetOrderByID(uint(orderIdInt))
	if err != nil {
		log.Printf("獲取訂單 %s 資料失敗: %v", orderID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get order"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Order retrieved successfully",
		"data":    order,
	})
}

func (h *Handler) HandlePostOrder(c *gin.Context) {
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

	log.Printf("準備新增訂單: %+v", order)

	// 呼叫 Google Sheet API 新增訂單資料
	orderId, err := google_sheet.AddOrder(order)
	if err != nil {
		log.Printf("新增訂單資料失敗: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add order"})
		return
	}

	log.Printf("訂單新增成功")

	c.JSON(http.StatusOK, gin.H{
		"status":   "success",
		"message":  "Order added successfully",
		"order_id": orderId,
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
