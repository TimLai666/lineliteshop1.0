import { apiService } from './api.js'

// 訂單相關 API
export const orderApi = {
    // 建立訂單
    async createOrder(orderData) {
        try {
            const response = await apiService.post('data/orders', {
                action: 'createOrder',
                ...orderData
            })
            return response
        } catch (error) {
            console.error('建立訂單失敗:', error)
            throw new Error('訂單建立失敗，請稍後再試')
        }
    },

    // 獲取用戶訂單列表
    async getUserOrders(lineUserId) {
        try {
            const response = await apiService.get('data/orders', {
                action: 'getUserOrders',
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
            const response = await apiService.get(`data/orders/${orderId}`, {
                action: 'getOrder',
                id: orderId
            })
            return response
        } catch (error) {
            console.error('獲取訂單詳情失敗:', error)
            throw new Error('無法載入訂單詳情')
        }
    },

    // 更新訂單狀態
    async updateOrderStatus(orderId, status) {
        try {
            const response = await apiService.put(`data/orders/${orderId}`, {
                action: 'updateOrderStatus',
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
            const response = await apiService.put(`data/orders/${orderId}/cancel`, {
                action: 'cancelOrder',
                orderId,
                reason
            })
            return response
        } catch (error) {
            console.error('取消訂單失敗:', error)
            throw new Error('取消訂單失敗，請稍後再試')
        }
    }
}
