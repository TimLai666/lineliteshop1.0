// 匯入所有 API 服務
import { apiService } from './api.js'
import { userApi } from './userService.js'
import { productApi } from './productService.js'
import { orderApi } from './orderService.js'

// 統一匯出所有 API 服務
export { apiService, userApi, productApi, orderApi }

// 也可以建立一個統一的 API 物件
export const api = {
    user: userApi,
    product: productApi,
    order: orderApi
}

// 錯誤處理工具
export const handleApiError = (error, defaultMessage = '操作失敗，請稍後再試') => {
    console.error('API Error:', error)

    if (error.message) {
        return error.message
    }

    return defaultMessage
}
