// 匯入所有 API 服務
import { apiService } from './api.js'
import { userApi } from './userService.js'
import { productApi } from './productService.js'
import { orderApi } from './orderService.js'

// 統一匯出所有 API 服務
export { apiService, userApi, productApi, orderApi }

// 也可以建立一個統一的 API 物件
export const api = {
    base: apiService,
    user: userApi,
    product: productApi,
    order: orderApi
}

// 錯誤處理工具
export const handleApiError = (error, defaultMessage = '操作失敗，請稍後再試') => {
    console.error('API Error:', error)

    // 處理不同類型的錯誤
    if (error.status) {
        switch (error.status) {
            case 400:
                return '請求參數錯誤'
            case 401:
                return '未授權，請重新登入'
            case 403:
                return '權限不足'
            case 404:
                return '資源不存在'
            case 500:
                return '伺服器錯誤，請稍後再試'
            default:
                return error.message || defaultMessage
        }
    }

    if (error.message) {
        return error.message
    }

    return defaultMessage
}

// API 請求攔截器（可以在這裡加入 loading 狀態、token 等）
export const createApiRequest = (apiFunction) => {
    return async (...args) => {
        try {
            // 這裡可以加入請求前的處理邏輯
            console.log('API 請求開始:', apiFunction.name)

            const result = await apiFunction(...args)

            // 這裡可以加入請求成功後的處理邏輯
            console.log('API 請求成功:', apiFunction.name)

            return result
        } catch (error) {
            // 這裡可以加入統一的錯誤處理邏輯
            console.error('API 請求失敗:', apiFunction.name, error)
            throw error
        }
    }
}
