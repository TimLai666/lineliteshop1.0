<template>
    <div class="register-container">
        <div class="register-card">
            <h2>用戶註冊</h2>

            <LoadingSpinner v-if="!isLiffReady" message="正在初始化 LINE 服務..." />

            <LoadingSpinner v-else-if="!profile" message="正在獲取用戶資訊..." />

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

                    <div class="form-group">
                        <label for="address">地址:</label>
                        <textarea id="address" v-model="registerData.address" placeholder="請輸入地址" rows="3"></textarea>
                    </div>

                    <button type="submit" :disabled="isRegistering" class="register-btn">
                        {{ isRegistering ? '註冊中...' : '完成註冊' }}
                    </button>
                </form>

                <MessageAlert v-if="registerResult" :message="registerResult.message" :type="registerResult.type"
                    :visible="true" />
            </div>

            <!-- 調試面板 -->
            <LiffDebugPanel />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { liff } from '@line/liff'
// import { LiffMockPlugin } from '@line/liff-mock' // 暫時不使用，改用自定義 Mock
import UserProfileCard from '../components/UserProfileCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import MessageAlert from '../components/MessageAlert.vue'
import LiffDebugPanel from '../components/LiffDebugPanel.vue'

const isLiffReady = ref(false)
const profile = ref(null)
const isRegistering = ref(false)
const registerResult = ref(null)

const registerData = ref({
    phone: '',
    email: '',
    birthday: '',
    address: ''
})

// 初始化 LIFF
onMounted(async () => {
    try {
        // 在開發環境中使用自定義 Mock
        if (import.meta.env.DEV) {
            console.log('🚀 開發模式：啟用自定義 LIFF Mock 功能')

            // 模擬 LIFF 初始化成功
            console.log('✅ LIFF Mock 初始化成功!')
            console.log('🔧 Mock 模式: 啟用')
            isLiffReady.value = true

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

            // 設定 profile 資料
            profile.value = mockProfile

            return // 在 Mock 模式下直接返回，不執行真實的 LIFF 初始化
        }

        // 生產環境：使用真實 LIFF
        console.log('🌍 生產模式：使用真實 LIFF 環境')

        await liff.init({
            liffId: '2007661588-kJDbPzDw'
        })

        console.log('✅ LIFF 初始化成功!')
        console.log('🔧 Mock 模式:', import.meta.env.DEV ? '啟用' : '停用')
        isLiffReady.value = true

        // 獲取 LIFF 上下文資訊
        const context = liff.getContext()
        console.log('LIFF Context:', context)

        // 檢查用戶是否已登入
        const isLoggedIn = liff.isLoggedIn()
        console.log('登入狀態:', isLoggedIn)

        if (isLoggedIn) {
            console.log('用戶已登入，正在獲取用戶資料...')
            try {
                // 獲取用戶資料
                const userProfile = await liff.getProfile()
                profile.value = userProfile
                console.log('用戶資料:', userProfile)
                console.log('用戶 UID:', userProfile.userId)
            } catch (profileError) {
                console.error('獲取用戶資料失敗:', profileError)
                registerResult.value = {
                    type: 'error',
                    message: '獲取用戶資料失敗，請確認 LIFF 設定中的 scope 權限'
                }
            }
        } else {
            console.log('用戶未登入，準備導向登入頁面...')
            // 如果未登入，導向登入頁面
            liff.login()
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

        registerResult.value = {
            type: 'error',
            message: errorMessage + '，請重新整理頁面'
        }
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
            displayName: profile.value.displayName,
            pictureUrl: profile.value.pictureUrl,
            statusMessage: profile.value.statusMessage,
            phone: registerData.value.phone,
            email: registerData.value.email,
            birthday: registerData.value.birthday,
            address: registerData.value.address,
            registeredAt: new Date().toISOString()
        }

        console.log('Registration data:', registrationData)

        // 這裡你可以發送資料到你的後端 API
        // const response = await fetch('/api/register', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(registrationData)
        // })

        // 模擬 API 呼叫
        await new Promise(resolve => setTimeout(resolve, 2000))

        registerResult.value = {
            type: 'success',
            message: '註冊成功！歡迎加入我們的服務'
        }

        // 重置表單
        registerData.value = {
            phone: '',
            email: '',
            birthday: '',
            address: ''
        }

    } catch (error) {
        console.error('Registration failed:', error)
        registerResult.value = {
            type: 'error',
            message: '註冊失敗，請稍後再試'
        }
    } finally {
        isRegistering.value = false
    }
}
</script>

<style scoped>
.register-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #00c851 0%, #00a537 100%);
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
    color: #333;
    margin-bottom: 24px;
    font-size: 24px;
    font-weight: 600;
}

.loading {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.profile-info {
    text-align: center;
}

.info-notice {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
    text-align: center;
}

.info-notice p {
    margin: 0 0 8px 0;
    color: #495057;
    font-weight: 500;
}

.info-notice small {
    color: #6c757d;
    font-size: 13px;
}

.avatar {
    margin-bottom: 16px;
}

.avatar img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid #00c851;
    object-fit: cover;
}

.user-info h3 {
    color: #333;
    margin: 16px 0 8px;
    font-size: 20px;
}

.uid {
    font-family: monospace;
    background: #f5f5f5;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #666;
    margin: 8px 0;
    word-break: break-all;
}

.status {
    color: #888;
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
    color: #333;
}

.required {
    color: #dc3545;
    font-weight: 600;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
    box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #00c851;
}

.register-btn {
    width: 100%;
    background: #00c851;
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
    background: #00a537;
}

.register-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
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
