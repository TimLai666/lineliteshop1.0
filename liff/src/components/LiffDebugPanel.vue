<template>
    <div class="debug-panel">
        <h3>🔍 LIFF 調試資訊</h3>

        <div class="debug-section">
            <h4>環境資訊</h4>
            <div class="debug-item">
                <strong>是否在 LINE 中:</strong> {{ debugInfo.isInClient ? '是' : '否' }}
            </div>
            <div class="debug-item">
                <strong>作業系統:</strong> {{ debugInfo.os }}
            </div>
            <div class="debug-item">
                <strong>LIFF 版本:</strong> {{ debugInfo.version }}
            </div>
            <div class="debug-item">
                <strong>當前 URL:</strong> {{ debugInfo.currentUrl }}
            </div>
        </div>

        <div class="debug-section">
            <h4>LIFF 狀態</h4>
            <div class="debug-item">
                <strong>LIFF ID:</strong> {{ debugInfo.liffId }}
            </div>
            <div class="debug-item">
                <strong>初始化狀態:</strong>
                <span :class="initStatus.class">{{ initStatus.text }}</span>
            </div>
            <div class="debug-item">
                <strong>登入狀態:</strong>
                <span :class="loginStatus.class">{{ loginStatus.text }}</span>
            </div>
        </div>

        <div v-if="context" class="debug-section">
            <h4>LIFF 上下文</h4>
            <div class="debug-item">
                <strong>類型:</strong> {{ context.type }}
            </div>
            <div class="debug-item">
                <strong>用戶 ID:</strong> {{ context.userId || '無' }}
            </div>
            <div class="debug-item">
                <strong>視圖類型:</strong> {{ context.viewType || '無' }}
            </div>
            <div class="debug-item">
                <strong>權限範圍:</strong> {{ context.scope?.join(', ') || '無' }}
            </div>
        </div>

        <div v-if="error" class="debug-section error-section">
            <h4>❌ 錯誤資訊</h4>
            <div class="debug-item">
                <strong>錯誤代碼:</strong> {{ error.code }}
            </div>
            <div class="debug-item">
                <strong>錯誤訊息:</strong> {{ error.message }}
            </div>
        </div>

        <div class="debug-actions">
            <button @click="refreshDebugInfo" class="debug-btn">
                🔄 重新檢查
            </button>
            <button @click="testLogin" class="debug-btn" :disabled="!canTestLogin">
                🔐 測試登入
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { liff } from '@line/liff'
import { getLiffId } from '../config'

const debugInfo = ref({
    isInClient: false,
    os: '',
    version: '',
    currentUrl: '',
    liffId: getLiffId()
})

const isLiffReady = ref(false)
const isLoggedIn = ref(false)
const context = ref(null)
const error = ref(null)

const initStatus = computed(() => {
    if (error.value) {
        return { text: '初始化失敗', class: 'status-error' }
    }
    if (isLiffReady.value) {
        return { text: '初始化成功', class: 'status-success' }
    }
    return { text: '初始化中...', class: 'status-pending' }
})

const loginStatus = computed(() => {
    if (!isLiffReady.value) {
        return { text: '等待初始化', class: 'status-pending' }
    }
    if (isLoggedIn.value) {
        return { text: '已登入', class: 'status-success' }
    }
    return { text: '未登入', class: 'status-error' }
})

const canTestLogin = computed(() => {
    return isLiffReady.value && !isLoggedIn.value && !debugInfo.value.isInClient
})

const refreshDebugInfo = async () => {
    try {
        // 基本環境資訊
        debugInfo.value = {
            isInClient: liff.isInClient(),
            os: liff.getOS(),
            version: liff.getVersion(),
            currentUrl: window.location.href,
            liffId: debugInfo.value.liffId
        }

        if (isLiffReady.value) {
            // LIFF 上下文
            context.value = liff.getContext()

            // 登入狀態
            isLoggedIn.value = liff.isLoggedIn()
        }
    } catch (err) {
        console.error('刷新調試資訊失敗:', err)
    }
}

const testLogin = () => {
    try {
        liff.login()
    } catch (err) {
        console.error('測試登入失敗:', err)
        error.value = {
            code: err.code || 'UNKNOWN',
            message: err.message || '未知錯誤'
        }
    }
}

onMounted(async () => {
    // 初始化基本資訊
    await refreshDebugInfo()

    try {
        console.log('🚀 開始 LIFF 初始化...')

        await liff.init({
            liffId: debugInfo.value.liffId
        })

        console.log('✅ LIFF 初始化成功')
        isLiffReady.value = true

        // 刷新所有資訊
        await refreshDebugInfo()

    } catch (err) {
        console.error('❌ LIFF 初始化失敗:', err)
        error.value = {
            code: err.code || 'UNKNOWN',
            message: err.message || '未知錯誤'
        }
    }
})
</script>

<style scoped>
.debug-panel {
    background: var(--bg-100);
    border: 1px solid var(--bg-200);
    border-radius: 8px;
    padding: 20px;
    margin: 20px;
    font-family: monospace;
    font-size: 14px;
    max-width: 600px;
}

.debug-panel h3 {
    margin: 0 0 20px 0;
    color: var(--text-100);
    font-family: sans-serif;
}

.debug-section {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    border: 1px solid var(--bg-200);
}

.debug-section h4 {
    margin: 0 0 10px 0;
    color: var(--text-200);
    font-size: 16px;
    font-family: sans-serif;
}

.debug-item {
    margin-bottom: 8px;
    display: flex;
    flex-wrap: wrap;
}

.debug-item strong {
    min-width: 120px;
    color: var(--text-100);
}

.status-success {
    color: var(--primary-100);
    font-weight: bold;
}

.status-error {
    color: #dc3545;
    font-weight: bold;
}

.status-pending {
    color: var(--primary-300);
    font-weight: bold;
}

.error-section {
    border-color: #dc3545;
    background: #f8d7da;
}

.debug-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.debug-btn {
    padding: 8px 16px;
    border: 1px solid var(--accent-100);
    background: var(--accent-100);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.debug-btn:hover:not(:disabled) {
    background: var(--accent-200);
}

.debug-btn:disabled {
    background: var(--bg-300);
    border-color: var(--bg-300);
    cursor: not-allowed;
}

@media (max-width: 600px) {
    .debug-panel {
        margin: 10px;
        padding: 15px;
    }

    .debug-item {
        flex-direction: column;
    }

    .debug-item strong {
        min-width: auto;
        margin-bottom: 4px;
    }
}
</style>
