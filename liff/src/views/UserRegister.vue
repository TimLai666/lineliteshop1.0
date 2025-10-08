<template>
    <div class="register-container">
        <div class="register-card">
            <h2>用戶註冊</h2>

            <LoadingSpinner v-if="!isReady" message="等待 LINE 服務初始化..." />

            <div v-else-if="!isLoggedIn" class="login-required">
                <div class="icon">🔐</div>
                <h3>需要登入 LINE</h3>
                <p>請先登入您的 LINE 帳號以繼續註冊</p>
                <button @click="handleLogin" class="login-btn">登入 LINE</button>
            </div>

            <LoadingSpinner v-else-if="!profile" message="正在獲取用戶資訊..." />

            <LoadingSpinner v-else-if="isCheckingUser" message="正在檢查用戶狀態..." />

            <div v-else-if="userExists" class="user-exists">
                <div class="icon">✅</div>
                <h3>您已經是我們的會員了！</h3>
                <p>檢測到您已經註冊過，正在為您跳轉到點餐頁面...</p>
            </div>

            <div v-else class="profile-info">
                <UserProfileCard :profile="profile" />

                <div class="info-notice">
                    <p>📝 請填寫以下資訊完成註冊</p>
                    <small>* LINE 不提供手機號碼、生日等資訊，需要您手動填寫</small>
                </div>

                <form @submit.prevent="handleRegister" class="register-form">
                    <div class="form-group">
                        <label for="phone">手機號碼: <span class="required">*</span></label>
                        <input type="tel" id="phone" v-model="registerData.phone" placeholder="請輸入手機號碼" required />
                    </div>

                    <div class="form-group">
                        <label for="email">電子郵件: <span class="required">*</span></label>
                        <input type="email" id="email" v-model="registerData.email" placeholder="請輸入電子郵件" required />
                    </div>

                    <div class="form-group">
                        <label for="birthday">生日:</label>
                        <input type="date" id="birthday" v-model="registerData.birthday" />
                    </div>

                    <button type="submit" :disabled="isRegistering" class="register-btn">
                        {{ isRegistering ? '註冊中...' : '完成註冊' }}
                    </button>
                </form>

                <MessageAlert v-if="registerResult" :message="registerResult.message" :type="registerResult.type"
                    :visible="true" />
            </div>

            <!-- 調試面板 -->
            <!-- <LiffDebugPanel /> -->
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserProfileCard from '../components/UserProfileCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import MessageAlert from '../components/MessageAlert.vue'
import LiffDebugPanel from '../components/LiffDebugPanel.vue'
import { userApi, handleApiError } from '../services/index.js'
import { useLiff } from '../composables/useLiff.js'

// 路由
const router = useRouter()

// 使用全局 LIFF 狀態
const {
    isReady,
    isLoggedIn,
    profile,
    closeLiff,
    loginLiff
} = useLiff()

// 組件狀態
const isRegistering = ref(false)
const registerResult = ref(null)
const isCheckingUser = ref(false)
const userExists = ref(false)

const registerData = ref({
    phone: '',
    email: '',
    birthday: '',
    address: ''
})

// 檢查用戶是否已存在
const checkUserExists = async (userId) => {
    isCheckingUser.value = true
    try {
        console.log('正在檢查用戶是否已存在:', userId)
        const userData = await userApi.getUserProfile(userId)

        if (userData) {
            console.log('用戶已存在:', userData)
            userExists.value = true

            // 用戶已存在，跳轉到記錄的頁面或預設點餐頁面
            const redirectPath = router.currentRoute.value.query.redirect || '/order'
            console.log('用戶已存在，開始跳轉到:', redirectPath)
            try {
                await router.push(redirectPath)
                console.log('跳轉成功')
            } catch (error) {
                console.error('跳轉失敗:', error)
                // 如果跳轉失敗，嘗試跳轉到點餐頁面
                try {
                    await router.push({ name: 'OrderFood' })
                    console.log('跳轉到預設頁面成功')
                } catch (secondError) {
                    console.error('跳轉到預設頁面也失敗:', secondError)
                }
            }

            return true
        } else {
            console.log('用戶不存在，可以繼續註冊')
            userExists.value = false
            return false
        }
    } catch (error) {
        console.log('檢查用戶狀態失敗，用戶可能不存在:', error)
        userExists.value = false
        return false
    } finally {
        isCheckingUser.value = false
    }
}

// 監聽 profile 變化，當獲取到用戶資料時檢查是否已存在
watch(profile, async (newProfile) => {
    if (newProfile && newProfile.userId) {
        await checkUserExists(newProfile.userId)
    }
}, { immediate: true })

// 處理登入
const handleLogin = () => {
    if (!isLoggedIn.value) {
        loginLiff()
    }
}

// 組件掛載時的處理
onMounted(() => {
    console.log('UserRegister 組件已掛載')
    console.log('LIFF 狀態:', {
        isReady: isReady.value,
        isLoggedIn: isLoggedIn.value,
        hasProfile: !!profile.value
    })

    // 如果已經有 profile，立即檢查用戶狀態
    if (profile.value && profile.value.userId) {
        checkUserExists(profile.value.userId)
    }
})

// 處理註冊
const handleRegister = async () => {
    if (!profile.value) {
        registerResult.value = {
            type: 'error',
            message: '無法獲取用戶資訊，請重新整理頁面'
        }
        return
    }

    isRegistering.value = true
    registerResult.value = null

    try {
        // 準備註冊資料
        const registrationData = {
            lineUserId: profile.value.userId,
            name: profile.value.displayName, // 改為 name 以符合 userService 的期望
            pictureUrl: profile.value.pictureUrl,
            statusMessage: profile.value.statusMessage,
            phone: registerData.value.phone,
            email: registerData.value.email,
            birthday: registerData.value.birthday,
            address: registerData.value.address,
            registeredAt: new Date().toISOString()
        }

        console.log('Registration data:', registrationData)

        // 使用 API 服務進行註冊
        const response = await userApi.register(registrationData)

        console.log('註冊成功:', response)

        // 標記用戶已註冊，避免路由守衛攔截
        userExists.value = true

        registerResult.value = {
            type: 'success',
            message: '註冊成功！正在為您跳轉...'
        }

        // 重置表單
        registerData.value = {
            phone: '',
            email: '',
            birthday: '',
            address: ''
        }

        // 註冊成功後，跳轉到記錄的頁面或預設點餐頁面
        const redirectPath = router.currentRoute.value.query.redirect || '/order'
        console.log('開始跳轉到:', redirectPath)
        try {
            await router.push(redirectPath)
            console.log('跳轉成功')
        } catch (error) {
            console.error('跳轉失敗:', error)
            // 如果跳轉失敗，可能是路由守衛攔截，嘗試跳轉到點餐頁面
            try {
                await router.push({ name: 'OrderFood' })
                console.log('跳轉到預設頁面成功')
            } catch (secondError) {
                console.error('跳轉到預設頁面也失敗:', secondError)
            }
        }




    } catch (error) {
        console.error('Registration failed:', error)
        registerResult.value = {
            type: 'error',
            message: handleApiError(error, '註冊失敗，請稍後再試')
        }
    } finally {
        isRegistering.value = false
    }
}
</script>

<style scoped>
.register-container {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
}

.register-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
}

.register-card h2 {
    text-align: center;
    color: var(--text-100);
    margin-bottom: 24px;
    font-size: 24px;
    font-weight: 600;
}

.loading {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-200);
}

.profile-info {
    text-align: center;
}

.info-notice {
    background: var(--bg-100);
    border: 1px solid var(--bg-200);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
    text-align: center;
}

.info-notice p {
    margin: 0 0 8px 0;
    color: var(--text-100);
    font-weight: 500;
}

.info-notice small {
    color: var(--text-200);
    font-size: 13px;
}

.avatar {
    margin-bottom: 16px;
}

.avatar img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid var(--primary-100);
    object-fit: cover;
}

.user-info h3 {
    color: var(--text-100);
    margin: 16px 0 8px;
    font-size: 20px;
}

.uid {
    font-family: monospace;
    background: var(--bg-100);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: var(--text-200);
    margin: 8px 0;
    word-break: break-all;
}

.status {
    color: var(--text-200);
    font-size: 14px;
    margin-bottom: 24px;
}

.register-form {
    text-align: left;
    margin-top: 24px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-100);
}

.required {
    color: #dc3545;
    font-weight: 600;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var(--bg-200);
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
    box-sizing: border-box;
    background-color: white;
    color: var(--text-100);
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-100);
}

.register-btn {
    width: 100%;
    background: var(--primary-100);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.register-btn:hover:not(:disabled) {
    background: var(--primary-200);
}

.register-btn:disabled {
    background: var(--bg-300);
    cursor: not-allowed;
}

.user-exists {
    text-align: center;
    padding: 40px 20px;
}

.user-exists .icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.user-exists h3 {
    color: var(--text-100);
    margin: 16px 0;
    font-size: 20px;
    font-weight: 600;
}

.user-exists p {
    color: var(--text-200);
    margin: 16px 0 24px;
    line-height: 1.5;
}

.close-btn {
    background: var(--primary-100);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.close-btn:hover {
    background: var(--primary-200);
}

.login-required {
    text-align: center;
    padding: 40px 20px;
}

.login-required .icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.login-required h3 {
    color: var(--text-100);
    margin: 16px 0;
    font-size: 20px;
    font-weight: 600;
}

.login-required p {
    color: var(--text-200);
    margin: 16px 0 24px;
    line-height: 1.5;
}

.login-btn {
    background: var(--primary-100);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.login-btn:hover {
    background: var(--primary-200);
}

@media (max-width: 600px) {
    .register-container {
        padding: 0;
        align-items: flex-start;
    }

    .register-card {
        padding: 20px;
        margin: 0;
        border-radius: 0;
        min-height: 100vh;
        box-sizing: border-box;
        width: 100vw;
        max-width: none;
    }

    .register-card h2 {
        font-size: 20px;
        margin-top: 20px;
    }
}
</style>
