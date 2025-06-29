import { apiService } from './api.js'

// 商品相關 API
export const productApi = {
    // 獲取所有商品
    async getAllProducts() {
        try {
            const response = await apiService.get('', {
                action: 'getProducts'
            })
            return response
        } catch (error) {
            console.error('獲取商品列表失敗:', error)
            throw new Error('無法載入商品資料')
        }
    },

    // 獲取單一商品詳情
    async getProductById(productId) {
        try {
            const response = await apiService.get('', {
                action: 'getProduct',
                id: productId
            })
            return response
        } catch (error) {
            console.error('獲取商品詳情失敗:', error)
            throw new Error('無法載入商品詳情')
        }
    },

    // 搜尋商品
    async searchProducts(keyword) {
        try {
            const response = await apiService.get('', {
                action: 'searchProducts',
                keyword
            })
            return response
        } catch (error) {
            console.error('搜尋商品失敗:', error)
            throw new Error('搜尋失敗，請稍後再試')
        }
    },

    // 獲取分類商品
    async getProductsByCategory(category) {
        try {
            const response = await apiService.get('', {
                action: 'getProductsByCategory',
                category
            })
            return response
        } catch (error) {
            console.error('獲取分類商品失敗:', error)
            throw new Error('無法載入分類商品')
        }
    }
}
