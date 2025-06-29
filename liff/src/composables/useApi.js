import { ref, computed } from 'vue'

// API 狀態管理 Composable
export function useApi() {
    const loading = ref(false)
    const error = ref(null)
    const data = ref(null)

    // 執行 API 請求的通用函數
    const execute = async (apiFunction, ...params) => {
        loading.value = true
        error.value = null
        data.value = null

        try {
            const result = await apiFunction(...params)
            data.value = result
            return result
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    // 重置狀態
    const reset = () => {
        loading.value = false
        error.value = null
        data.value = null
    }

    // 計算屬性
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => error.value !== null)
    const hasData = computed(() => data.value !== null)

    return {
        loading: isLoading,
        error: computed(() => error.value),
        data: computed(() => data.value),
        hasError,
        hasData,
        execute,
        reset
    }
}

// 專門用於用戶相關 API 的 Composable
export function useUserApi() {
    const { loading, error, data, hasError, hasData, execute, reset } = useApi()

    const register = async (userData) => {
        const { userApi } = await import('../services/index.js')
        return execute(userApi.register, userData)
    }

    const checkUser = async (lineUserId) => {
        const { userApi } = await import('../services/index.js')
        return execute(userApi.checkUserExists, lineUserId)
    }

    const getProfile = async (lineUserId) => {
        const { userApi } = await import('../services/index.js')
        return execute(userApi.getUserProfile, lineUserId)
    }

    const updateProfile = async (lineUserId, userData) => {
        const { userApi } = await import('../services/index.js')
        return execute(userApi.updateUserProfile, lineUserId, userData)
    }

    return {
        loading,
        error,
        data,
        hasError,
        hasData,
        register,
        checkUser,
        getProfile,
        updateProfile,
        reset
    }
}
