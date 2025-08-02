import { apiService } from './api.js'

// 訂單相關 API
export const orderApi = {
    // 建立訂單
    async createOrder(orderData) {
        try {
            console.log('正在發送訂單到後端:', orderData)
            const response = await apiService.post('data/order', orderData)
            console.log('後端回應:', response)
            return response
        } catch (error) {
            console.error('建立訂單失敗:', error)
            throw new Error(`訂單建立失敗: ${error.message}`)
        }
    },

    // 獲取用戶訂單列表
    async getUserOrders(lineUserId) {
        try {
            const response = await apiService.get('data/orders', {
                lineUserId
            })
            return response
        } catch (error) {
            console.error('獲取訂單列表失敗:', error)
            throw new Error('無法載入訂單資料')
        }
    },

    // 獲取訂單詳情
    async getOrderById(orderId) {
        try {
            const response = await apiService.get(`data/order/${orderId}`)
            return response
        } catch (error) {
            console.error('獲取訂單詳情失敗:', error)
            throw new Error('無法載入訂單詳情')
        }
    },

    // 更新訂單狀態
    async updateOrderStatus(orderId, status) {
        try {
            const response = await apiService.put(`data/order`, {
                orderId,
                status
            })
            return response
        } catch (error) {
            console.error('更新訂單狀態失敗:', error)
            throw new Error('更新失敗，請稍後再試')
        }
    },

    // 取消訂單
    async cancelOrder(orderId, reason) {
        try {
            const response = await apiService.put(`data/order`, {
                orderId,
                reason,
                status: 'cancelled'
            })
            return response
        } catch (error) {
            console.error('取消訂單失敗:', error)
            throw new Error('取消訂單失敗，請稍後再試')
        }
    }
}
