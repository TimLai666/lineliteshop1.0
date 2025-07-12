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

    // 檢查用戶是否已註冊 (透過獲取用戶資料來檢查)
    async checkUserExists(lineUserId) {
        try {
            const response = await apiService.get(`data/customer/${lineUserId}`)
            return response
        } catch (error) {
            // 如果是 404 錯誤，表示用戶不存在，這是正常情況
            if (error.status === 404) {
                return null
            }
            console.error('檢查用戶狀態失敗:', error)
            throw new Error('無法檢查用戶狀態')
        }
    },

    // 獲取用戶資料
    async getUserProfile(lineUserId) {
        try {
            const response = await apiService.get(`data/customer/${lineUserId}`)
            return response
        } catch (error) {
            console.error('獲取用戶資料失敗:', error)
            throw new Error('無法獲取用戶資料')
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
