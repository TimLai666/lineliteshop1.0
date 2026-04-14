import { apiService } from './api.js'

export const userApi = {
    async register(userData) {
        try {
            const response = await apiService.post('data/customer', {
                id: userData.lineUserId,
                name: userData.name,
                birthday: userData.birthday || '',
                email: userData.email || '',
                phone: userData.phone || '',
                occupation: userData.occupation || '',
                gender: userData.gender || '',
                income_range: userData.incomeRange || '',
                household_size: userData.householdSize || '',
            })
            return response
        } catch (error) {
            console.error('用戶註冊失敗:', error)
            throw new Error('註冊失敗，請稍後再試')
        }
    },

    async getUserProfile(lineUserId) {
        try {
            const response = await apiService.get(`data/customer/${lineUserId}`)
            return response.data
        } catch (error) {
            if (error.status === 404) {
                console.log('用戶不存在:', lineUserId)
                return null
            }
            console.error('取得用戶資料失敗:', error)
            throw error
        }
    },

    async checkUserExists(lineUserId) {
        try {
            const userData = await this.getUserProfile(lineUserId)
            return userData !== null
        } catch (error) {
            console.error('檢查用戶是否存在失敗:', error)
            return false
        }
    },

    async updateUserProfile(lineUserId, userData) {
        try {
            const response = await apiService.put('data/customer', {
                id: lineUserId,
                ...userData,
            })
            return response
        } catch (error) {
            console.error('更新用戶資料失敗:', error)
            throw new Error('更新失敗，請稍後再試')
        }
    },
}
