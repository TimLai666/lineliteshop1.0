import { apiService } from './api.js'

// 商品相關 API
export const productApi = {
    // 獲取所有商品
    async getAllProducts() {
        try {
            console.log('正在呼叫 API: /api/data/products')
            const response = await apiService.get('data/products')
            console.log('API 回應:', response)

            // 處理後端回傳的 {data: [...]} 格式
            if (response && response.data && Array.isArray(response.data)) {
                console.log('找到商品資料:', response.data.length, '個商品')
                return response.data
            }
            console.warn('商品資料格式不正確:', response)
            return []
        } catch (error) {
            console.error('獲取商品列表失敗:', error)
            throw new Error('無法載入商品資料')
        }
    },

    // 獲取單一商品詳情
    async getProductByName(productName) {
        try {
            // 注意：這個端點可能需要調整，因為後端沒有對應的路由
            const response = await apiService.get(`data/product/${productName}`)
            return response
        } catch (error) {
            console.error('獲取商品詳情失敗:', error)
            throw new Error('無法載入商品詳情')
        }
    },

    // 獲取分類商品
    // todo: 增加分類功能 - 後端尚未實作此端點
    async getProductsByCategory(category) {
        try {
            // 暫時通過獲取所有商品然後在前端過濾
            const allProducts = await productApi.getAllProducts()

            if (!allProducts || !Array.isArray(allProducts)) {
                return []
            }

            return allProducts.filter(product =>
                product.category === category
            )
        } catch (error) {
            console.error('獲取分類商品失敗:', error)
            throw new Error('無法載入分類商品')
        }
    }
}
