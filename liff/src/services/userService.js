import { apiService } from './api.js'

// 用戶相關 API
export const userApi = {
    // 用戶註冊
    async register(userData) {
        try {
            const response = await apiService.post('data/customer', {
                id: userData.lineUserId,
                name: userData.name,
                birthday: userData.birthday || '', // 可選欄位
                email: userData.email || '', // 可選欄位
                phone: userData.phone || '', // 可選欄位
            })
            return response
        } catch (error) {
            console.error('用戶註冊失敗:', error)
            throw new Error('註冊失敗，請稍後再試')
        }
    },

    // 獲取用戶資料
    async getUserProfile(lineUserId) {
        try {
            const response = await apiService.get(`data/customer/${lineUserId}`)
            return response.data
        } catch (error) {
            // 如果是 404 錯誤（用戶不存在），返回 null
            if (error.status === 404) {
                console.log('用戶不存在:', lineUserId)
                return null
            }
            console.error('獲取用戶資料失敗:', error)
            throw error
        }
    },

    // 檢查用戶是否存在
    async checkUserExists(lineUserId) {
        try {
            const userData = await this.getUserProfile(lineUserId)
            return userData !== null
        } catch (error) {
            console.error('檢查用戶存在性失敗:', error)
            return false
        }
    },

    // 更新用戶資料
    async updateUserProfile(lineUserId, userData) {
        try {
            const response = await apiService.put('data/customer', {
                id: lineUserId,
                ...userData
            })
            return response
        } catch (error) {
            console.error('更新用戶資料失敗:', error)
            throw new Error('更新失敗，請稍後再試')
        }
    }
}
