<template>
    <div class="register-container">
        <div class="register-card">
            <h2>用戶註冊</h2>

            <LoadingSpinner v-if="!isReady" message="正在初始化 LINE 登入..." />

            <div v-else-if="!isLoggedIn" class="login-required">
                <div class="icon">🔐</div>
                <h3>請先登入 LINE</h3>
                <p>請先登入您的 LINE 帳號以繼續註冊。</p>
                <button @click="handleLogin" class="login-btn">登入 LINE</button>
            </div>

            <LoadingSpinner v-else-if="!profile" message="正在取得用戶資料..." />

            <LoadingSpinner v-else-if="isCheckingUser" message="正在檢查註冊狀態..." />

            <div v-else-if="userExists" class="user-exists">
                <div class="icon">✅</div>
                <h3>已經註冊過了</h3>
                <p>系統偵測到您已完成註冊，正在為您跳轉到點餐頁面...</p>
            </div>

            <div v-else class="profile-info">
                <UserProfileCard :profile="profile" />

                <div class="info-notice">
                    <p>請填寫以下資訊完成註冊</p>
                    <small>* LINE 顯示名稱會作為會員姓名帶入，仍可在後台再調整</small>
                </div>

                <form @submit.prevent="handleRegister" class="register-form">
                    <div class="form-group">
                        <label for="phone">手機號碼: <span class="required">*</span></label>
                        <input
                            type="tel"
                            id="phone"
                            v-model="registerData.phone"
                            placeholder="請輸入手機號碼"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="email">電子郵件: <span class="required">*</span></label>
                        <input
                            type="email"
                            id="email"
                            v-model="registerData.email"
                            placeholder="請輸入電子郵件"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="birthday">生日:</label>
                        <input type="date" id="birthday" v-model="registerData.birthday" />
                    </div>

                    <div class="form-group">
                        <label for="occupation">職業:</label>
                        <input
                            type="text"
                            id="occupation"
                            v-model="registerData.occupation"
                            placeholder="請輸入職業"
                        />
                    </div>

                    <div class="form-group">
                        <label for="gender">性別:</label>
                        <select id="gender" v-model="registerData.gender">
                            <option value="">請選擇性別</option>
                            <option v-for="option in genderOptions" :key="option" :value="option">
                                {{ option }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="incomeRange">月收入區間:</label>
                        <select id="incomeRange" v-model="registerData.incomeRange">
                            <option value="">請選擇月收入區間</option>
                            <option v-for="option in incomeRangeOptions" :key="option" :value="option">
                                {{ option }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="householdSize">同住人口數:</label>
                        <select id="householdSize" v-model="registerData.householdSize">
                            <option value="">請選擇同住人口數</option>
                            <option v-for="option in householdSizeOptions" :key="option" :value="option">
                                {{ option }}
                            </option>
                        </select>
                    </div>

                    <button type="submit" :disabled="isRegistering" class="register-btn">
                        {{ isRegistering ? '註冊中...' : '完成註冊' }}
                    </button>
                </form>

                <MessageAlert
                    v-if="registerResult"
                    :message="registerResult.message"
                    :type="registerResult.type"
                    :visible="true"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import MessageAlert from '../components/MessageAlert.vue'
import UserProfileCard from '../components/UserProfileCard.vue'
import { useLiff } from '../composables/useLiff.js'
import { handleApiError, userApi } from '../services/index.js'

const router = useRouter()

const {
    isReady,
    isLoggedIn,
    profile,
    loginLiff,
} = useLiff()

const isRegistering = ref(false)
const registerResult = ref(null)
const isCheckingUser = ref(false)
const userExists = ref(false)

const genderOptions = ['男', '女', '非二元', '不透露']
const incomeRangeOptions = [
    '未滿30,000',
    '30,000-49,999',
    '50,000-69,999',
    '70,000-99,999',
    '100,000以上',
    '不透露',
]
const householdSizeOptions = ['1人', '2人', '3人', '4人', '5人以上']

const createInitialRegisterData = () => ({
    phone: '',
    email: '',
    birthday: '',
    occupation: '',
    gender: '',
    incomeRange: '',
    householdSize: '',
})

const registerData = ref(createInitialRegisterData())

const redirectToNextPage = async () => {
    const redirectPath = router.currentRoute.value.query.redirect || '/order'
    try {
        await router.push(redirectPath)
    } catch (error) {
        console.error('路由跳轉失敗:', error)
        await router.push({ name: 'OrderFood' })
    }
}

const checkUserExists = async (userId) => {
    isCheckingUser.value = true
    try {
        const userData = await userApi.getUserProfile(userId)
        if (!userData) {
            userExists.value = false
            return false
        }

        userExists.value = true
        await redirectToNextPage()
        return true
    } catch (error) {
        console.log('檢查註冊狀態失敗，視為尚未註冊:', error)
        userExists.value = false
        return false
    } finally {
        isCheckingUser.value = false
    }
}

watch(
    profile,
    async (newProfile) => {
        if (newProfile?.userId) {
            await checkUserExists(newProfile.userId)
        }
    },
    { immediate: true },
)

const handleLogin = () => {
    if (!isLoggedIn.value) {
        loginLiff()
    }
}

onMounted(() => {
    if (profile.value?.userId) {
        checkUserExists(profile.value.userId)
    }
})

const handleRegister = async () => {
    if (!profile.value) {
        registerResult.value = {
            type: 'error',
            message: '無法取得 LINE 用戶資料，請重新登入後再試。',
        }
        return
    }

    isRegistering.value = true
    registerResult.value = null

    try {
        const registrationData = {
            lineUserId: profile.value.userId,
            name: profile.value.displayName,
            pictureUrl: profile.value.pictureUrl,
            statusMessage: profile.value.statusMessage,
            phone: registerData.value.phone,
            email: registerData.value.email,
            birthday: registerData.value.birthday,
            occupation: registerData.value.occupation,
            gender: registerData.value.gender,
            incomeRange: registerData.value.incomeRange,
            householdSize: registerData.value.householdSize,
            registeredAt: new Date().toISOString(),
        }

        await userApi.register(registrationData)

        userExists.value = true
        registerResult.value = {
            type: 'success',
            message: '註冊成功，正在為您跳轉...',
        }

        registerData.value = createInitialRegisterData()
        await redirectToNextPage()
    } catch (error) {
        console.error('Registration failed:', error)
        registerResult.value = {
            type: 'error',
            message: handleApiError(error, '註冊失敗，請稍後再試'),
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
.form-group select,
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
.form-group select:focus,
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

.user-exists,
.login-required {
    text-align: center;
    padding: 40px 20px;
}

.user-exists .icon,
.login-required .icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.user-exists h3,
.login-required h3 {
    color: var(--text-100);
    margin: 16px 0;
    font-size: 20px;
    font-weight: 600;
}

.user-exists p,
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
