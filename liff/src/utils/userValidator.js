import { userApi } from '../services'

/**
 * 用戶驗證輔助工具
 */
export class UserValidator {
    /**
     * 檢查用戶是否已註冊
     * @param {string} lineUserId - LINE 用戶 ID
     * @returns {Promise<boolean>} 是否已註冊
     */
    static async isUserRegistered(lineUserId) {
        if (!lineUserId) {
            console.warn('UserValidator: 無效的 LINE 用戶 ID')
            return false
        }

        try {
            console.log('UserValidator: 檢查用戶是否已註冊:', lineUserId)
            const userProfile = await userApi.getUserProfile(lineUserId)

            const isRegistered = userProfile !== null && userProfile !== undefined
            console.log('UserValidator: 用戶註冊狀態:', isRegistered ? '已註冊' : '未註冊')

            return isRegistered
        } catch (error) {
            console.error('UserValidator: 檢查用戶註冊狀態失敗:', error)
            return false
        }
    }

    /**
     * 檢查並處理用戶驗證
     * 用於路由守衛中
     * @param {string} lineUserId - LINE 用戶 ID
     * @param {string} targetRouteName - 目標路由名稱
     * @returns {Promise<{shouldRedirect: boolean, redirectTo?: string}>}
     */
    static async validateUserForRoute(lineUserId, targetRouteName) {
        // 如果目標就是註冊頁面，直接通過
        if (targetRouteName === 'UserRegister') {
            return { shouldRedirect: false }
        }

        // 檢查是否有有效的用戶 ID
        if (!lineUserId) {
            console.log('UserValidator: 沒有有效的用戶 ID，重定向到註冊頁面')
            return { shouldRedirect: true, redirectTo: 'UserRegister' }
        }

        // 檢查用戶是否已註冊
        const isRegistered = await this.isUserRegistered(lineUserId)

        if (!isRegistered) {
            console.log('UserValidator: 用戶未註冊，重定向到註冊頁面')
            return { shouldRedirect: true, redirectTo: 'UserRegister' }
        }

        console.log('UserValidator: 用戶驗證通過')
        return { shouldRedirect: false }
    }

    /**
     * 檢查 LIFF 環境是否準備就緒
     * @param {object} liffInstance - LIFF 實例
     * @returns {boolean} 是否準備就緒
     */
    static isLiffReady(liffInstance) {
        try {
            return liffInstance &&
                typeof liffInstance.isInClient === 'function' &&
                typeof liffInstance.isLoggedIn === 'function' &&
                typeof liffInstance.getProfile === 'function'
        } catch (error) {
            console.error('UserValidator: LIFF 實例檢查失敗:', error)
            return false
        }
    }

    /**
     * 從 LIFF 獲取用戶 ID
     * @param {object} liffInstance - LIFF 實例
     * @returns {string|null} 用戶 ID
     */
    static async getUserIdFromLiff(liffInstance) {
        try {
            if (!this.isLiffReady(liffInstance)) {
                console.warn('UserValidator: LIFF 未準備就緒')
                return null
            }

            if (!liffInstance.isLoggedIn()) {
                console.warn('UserValidator: 用戶未登入 LIFF')
                return null
            }

            const profile = await liffInstance.getProfile()
            return profile?.userId || null
        } catch (error) {
            console.error('UserValidator: 獲取 LIFF 用戶 ID 失敗:', error)
            return null
        }
    }
}

/**
 * 簡化的用戶驗證函數
 * @param {string} lineUserId - LINE 用戶 ID
 * @returns {Promise<boolean>} 是否已註冊
 */
export const checkUserRegistration = async (lineUserId) => {
    return await UserValidator.isUserRegistered(lineUserId)
}

/**
 * 用於路由守衛的驗證函數
 * @param {string} lineUserId - LINE 用戶 ID
 * @param {string} targetRouteName - 目標路由名稱
 * @returns {Promise<{shouldRedirect: boolean, redirectTo?: string}>}
 */
export const validateUserForNavigation = async (lineUserId, targetRouteName) => {
    return await UserValidator.validateUserForRoute(lineUserId, targetRouteName)
}
