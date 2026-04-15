import { ref, reactive, computed, readonly } from 'vue'
import { liff } from '@line/liff'
import { isLiffMockEnabled, getLiffId } from '../config'

// 全局 LIFF 狀態
const liffState = reactive({
    isReady: false,
    isLoggedIn: false,
    profile: null,
    context: null,
    error: null,
    isInitializing: false
})

// LIFF 初始化函數
const initializeLiff = async () => {
    if (liffState.isInitializing || liffState.isReady) {
        return liffState
    }

    liffState.isInitializing = true
    liffState.error = null

    try {
        // 僅在明確開啟旗標時才使用 LIFF Mock
        if (isLiffMockEnabled()) {
            console.log('🚀 啟用自定義 LIFF Mock 功能')

            // 模擬 LIFF 初始化成功
            console.log('✅ LIFF Mock 初始化成功!')
            console.log('🔧 Mock 模式: 啟用')

            // 模擬獲取上下文
            const mockContext = {
                type: 'utou',
                userId: 'U1234567890abcdef',
                utouId: 'U1234567890'
            }
            console.log('LIFF Context (Mock):', mockContext)

            // 模擬登入狀態為 true
            const mockIsLoggedIn = true
            console.log('登入狀態 (Mock):', mockIsLoggedIn)

            // 直接設定模擬的用戶資料
            const mockProfile = {
                userId: 'U1234567890abcdef',
                displayName: '測試用戶 🎭',
                pictureUrl: 'https://profile.line-scdn.net/0hWTtohNNVMGBREDyBFMFBbHF1MQg1CDkBfAQqBSsVFAozVSgELgMpGHgBEVoyVigILgQtHSsBFFk8',
                statusMessage: '這是 Mock 測試用戶帳號'
            }

            console.log('用戶已登入 (Mock)，正在獲取用戶資料...')
            console.log('用戶資料 (Mock):', mockProfile)
            console.log('用戶 UID (Mock):', mockProfile.userId)

            // 設定狀態
            liffState.isReady = true
            liffState.isLoggedIn = mockIsLoggedIn
            liffState.profile = mockProfile
            liffState.context = mockContext

            return liffState
        }

        // 生產環境：使用真實 LIFF
        console.log('🌍 生產模式：使用真實 LIFF 環境')

        await liff.init({
            liffId: getLiffId()
        })

        console.log('✅ LIFF 初始化成功!')
        console.log('🔧 Mock 模式:', isLiffMockEnabled() ? '啟用' : '停用')

        // 獲取 LIFF 上下文資訊
        const context = liff.getContext()
        console.log('LIFF Context:', context)

        // 檢查用戶是否已登入
        const isLoggedIn = liff.isLoggedIn()
        console.log('登入狀態:', isLoggedIn)

        liffState.isReady = true
        liffState.context = context
        liffState.isLoggedIn = isLoggedIn

        if (isLoggedIn) {
            console.log('用戶已登入，正在獲取用戶資料...')
            try {
                // 獲取用戶資料
                const userProfile = await liff.getProfile()
                liffState.profile = userProfile
                console.log('用戶資料:', userProfile)
                console.log('用戶 UID:', userProfile.userId)
            } catch (profileError) {
                console.error('獲取用戶資料失敗:', profileError)
                throw new Error('獲取用戶資料失敗，請確認 LIFF 設定中的 scope 權限')
            }
        }

    } catch (error) {
        console.error('LIFF 初始化失敗:', error)
        console.error('錯誤詳情:', {
            code: error.code,
            message: error.message,
            cause: error.cause
        })

        let errorMessage = 'LINE 服務初始化失敗'

        if (error.code === 'INVALID_CONFIG') {
            errorMessage = 'LIFF ID 不正確，請檢查設定'
        } else if (error.code === 'UNAUTHORIZED') {
            errorMessage = '未授權存取，請檢查 LIFF 應用程式設定'
        } else if (error.code === 'FORBIDDEN') {
            errorMessage = '權限不足，請檢查 LIFF 應用程式的 scope 設定'
        }

        liffState.error = errorMessage + '，請重新整理頁面'
        throw error
    } finally {
        liffState.isInitializing = false
    }

    return liffState
}

// LIFF 登入函數
const loginLiff = () => {
    if (isLiffMockEnabled()) {
        console.log('Mock 模式：模擬 LIFF 登入')
        return
    }

    if (liffState.isReady && !liffState.isLoggedIn) {
        liff.login()
    }
}

// 關閉 LIFF 函數
const closeLiff = () => {
    try {
        if (isLiffMockEnabled()) {
            console.log('Mock 模式：模擬關閉 LIFF')
            alert('Mock 模式：模擬關閉 LIFF 頁面')
            return
        }

        // 生產模式：真正關閉 LIFF
        liff.closeWindow()
    } catch (error) {
        console.error('關閉 LIFF 失敗:', error)
        // 如果關閉失敗，嘗試重定向到 LINE 聊天室
        if (typeof window !== 'undefined') {
            window.close()
        }
    }
}

// 發送訊息到 LINE 聊天室
const sendMessage = (message) => {
    if (isLiffMockEnabled()) {
        console.log('Mock 模式：模擬發送訊息:', message)
        return Promise.resolve()
    }

    if (liffState.isReady) {
        return liff.sendMessages([{
            type: 'text',
            text: message
        }])
    }
}

// 檢查是否在 LINE 內部瀏覽器
const isInClient = () => {
    if (isLiffMockEnabled()) {
        return true // Mock 模式假設在 LINE 內部
    }
    return liffState.isReady ? liff.isInClient() : false
}

// 組合式函數
export const useLiff = () => {
    return {
        // 狀態
        liffState: readonly(liffState),

        // 計算屬性
        isReady: computed(() => liffState.isReady),
        isLoggedIn: computed(() => liffState.isLoggedIn),
        profile: computed(() => liffState.profile),
        context: computed(() => liffState.context),
        error: computed(() => liffState.error),
        isInitializing: computed(() => liffState.isInitializing),

        // 方法
        initializeLiff,
        loginLiff,
        closeLiff,
        sendMessage,
        isInClient,

        // 新增：用戶檢查方法
        getUserId: () => liffState.profile?.userId,
        hasValidProfile: () => liffState.profile && liffState.profile.userId,
        isUserLoggedInAndReady: () => liffState.isReady && liffState.isLoggedIn && liffState.profile
    }
}

// 匯出狀態供其他地方使用
export { liffState }
