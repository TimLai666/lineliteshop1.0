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
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { liff } from '@line/liff'
import UserProfileCard from '../components/UserProfileCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import MessageAlert from '../components/MessageAlert.vue'

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
        await liff.init({
            liffId: '1657778888-xxxxxx' // 替換為你的 LIFF ID
        })

        console.log('LIFF initialized successfully')
        isLiffReady.value = true

        // 檢查用戶是否已登入
        if (liff.isLoggedIn()) {
            // 獲取用戶資料
            const userProfile = await liff.getProfile()
            profile.value = userProfile
            console.log('User profile:', userProfile)
            console.log('User UID:', userProfile.userId)
        } else {
            // 如果未登入，導向登入頁面
            liff.login()
        }
    } catch (error) {
        console.error('LIFF initialization failed:', error)
        registerResult.value = {
            type: 'error',
            message: 'LINE 服務初始化失敗，請重新整理頁面'
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
    padding: 20px;
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
    .register-card {
        padding: 24px;
        margin: 10px;
    }

    .register-card h2 {
        font-size: 20px;
    }
}
</style>
