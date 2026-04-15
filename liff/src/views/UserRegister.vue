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
                        <label for="householdSize">同住人口數（包含自己）:</label>
                        <select id="householdSize" v-model="registerData.householdSize">
                            <option value="">請選擇同住人口數（包含自己）</option>
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
    background:
        radial-gradient(circle at top, rgba(255, 255, 255, 0.36), transparent 28%),
        linear-gradient(180deg, rgba(var(--primary-rgb), 0.88) 0%, rgba(var(--primary-rgb), 0.62) 42%, #f6ede4 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    margin: 0;
}

.register-card {
    position: relative;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 249, 241, 0.92));
    border-radius: 32px;
    padding: 34px 28px;
    box-shadow: var(--shadow-strong);
    max-width: 500px;
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.4);
    overflow: hidden;
    backdrop-filter: blur(18px);
}

.register-card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 108px;
    background: linear-gradient(180deg, rgba(var(--primary-rgb), 0.15), transparent 100%);
    pointer-events: none;
}

.register-card h2 {
    text-align: center;
    color: var(--text-100);
    margin-bottom: 20px;
    font-size: 28px;
    font-weight: 600;
    position: relative;
    z-index: 1;
}

.profile-info {
    text-align: center;
    position: relative;
    z-index: 1;
}

.info-notice {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 245, 236, 0.72));
    border: 1px solid rgba(var(--primary-rgb), 0.14);
    border-radius: 20px;
    padding: 18px 16px;
    margin: 24px 0;
    text-align: center;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
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
    margin-top: 26px;
}

.form-group {
    margin-bottom: 18px;
}

.form-group label {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: var(--text-100);
    letter-spacing: 0.01em;
}

.required {
    color: #dc3545;
    font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid rgba(126, 94, 79, 0.16);
    border-radius: 18px;
    font-size: 16px;
    transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.86);
    color: var(--text-100);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-100);
    background: white;
    box-shadow:
        0 0 0 4px rgba(var(--primary-rgb), 0.08),
        0 14px 30px rgba(var(--primary-rgb), 0.08);
}

.register-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
    color: white;
    border: none;
    padding: 16px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s, background-color 0.25s;
    box-shadow: 0 18px 30px rgba(var(--primary-rgb), 0.22);
}

.register-btn:hover:not(:disabled) {
    background: var(--primary-200);
    transform: translateY(-1px);
}

.register-btn:disabled {
    background: var(--bg-300);
    cursor: not-allowed;
    box-shadow: none;
}

.user-exists,
.login-required {
    text-align: center;
    padding: 40px 20px;
    position: relative;
    z-index: 1;
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
    font-size: 22px;
    font-weight: 600;
}

.user-exists p,
.login-required p {
    color: var(--text-200);
    margin: 16px 0 24px;
    line-height: 1.5;
}

.login-btn {
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.25s;
}

.login-btn:hover {
    background: var(--primary-200);
    transform: translateY(-1px);
}

@media (max-width: 600px) {
    .register-container {
        padding: 12px;
        align-items: flex-start;
    }

    .register-card {
        padding: 24px 18px 28px;
        margin: 0 auto;
        border-radius: 28px;
        min-height: calc(100vh - 24px);
        box-sizing: border-box;
        width: 100%;
        max-width: none;
    }

    .register-card h2 {
        font-size: 24px;
        margin-top: 8px;
    }
}
</style>
