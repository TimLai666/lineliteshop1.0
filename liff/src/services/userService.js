// import { apiService } from './api.js'

// 用戶相關 API
export const userApi = {
    // 用戶註冊
    async register(userData) {
        try {
            const response = await apiService.post('', {
                action: 'ADD_CUSTOMER',
                customer: {
                    id: userData.lineUserId,
                    name: userData.name,
                    birthday: userData.birthday || '', // 可選欄位
                    email: userData.email || '', // 可選欄位
                    phone: userData.phone || '', // 可選欄位
                }
            })
            return response
        } catch (error) {
            console.error('用戶註冊失敗:', error)
            throw new Error('註冊失敗，請稍後再試')
        }
    },

    // 檢查用戶是否已註冊
    async checkUserExists(lineUserId) {
        try {
            const response = await apiService.get('', {
                action: 'checkUser',
                lineUserId
            })
            return response
        } catch (error) {
            console.error('檢查用戶狀態失敗:', error)
            throw new Error('無法檢查用戶狀態')
        }
    },

    // 獲取用戶資料
    async getUserProfile(lineUserId) {
        try {
            const response = await apiService.get('', {
                action: 'getUser',
                lineUserId
            })
            return response
        } catch (error) {
            console.error('獲取用戶資料失敗:', error)
            throw new Error('無法獲取用戶資料')
        }
    },

    // 更新用戶資料
    async updateUserProfile(lineUserId, userData) {
        try {
            const response = await apiService.post('', {
                action: 'updateUser',
                lineUserId,
                ...userData
            })
            return response
        } catch (error) {
            console.error('更新用戶資料失敗:', error)
            throw new Error('更新失敗，請稍後再試')
        }
    }
}
