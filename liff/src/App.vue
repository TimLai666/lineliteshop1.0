<template>
  <div id="app">
    <!-- 全局加載指示器 -->
    <div v-if="isInitializing" class="global-loading">
      <div class="loading-spinner"></div>
      <p>正在初始化 LINE 服務...</p>
    </div>

    <!-- LIFF 初始化錯誤 -->
    <div v-else-if="error" class="global-error">
      <div class="error-icon">⚠️</div>
      <h3>服務初始化失敗</h3>
      <p>{{ error }}</p>
      <button @click="retryInit" class="retry-btn">重試</button>
    </div>

    <!-- 主要內容 -->
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLiff } from './composables/useLiff.js'

// 使用 LIFF 組合式函數
const {
  initializeLiff,
  isInitializing,
  error,
  isReady
} = useLiff()

// 重試初始化
const retryInit = async () => {
  try {
    await initializeLiff()
  } catch (err) {
    console.error('重試初始化失敗:', err)
  }
}

// 在應用程式啟動時初始化 LIFF
onMounted(async () => {
  console.log('🚀 App.vue: 開始初始化 LIFF...')
  try {
    await initializeLiff()
    console.log('✅ App.vue: LIFF 初始化完成')
  } catch (err) {
    console.error('❌ App.vue: LIFF 初始化失敗:', err)
  }
})
</script>

<style>
/* 確保 App 組件完全沒有 padding 和 margin */
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

/* 全局加載指示器樣式 */
.global-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  color: white;
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.global-loading p {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

/* 全局錯誤樣式 */
.global-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  text-align: center;
  padding: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.global-error h3 {
  font-size: 24px;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.global-error p {
  font-size: 16px;
  margin: 0 0 24px 0;
  opacity: 0.9;
  line-height: 1.5;
  max-width: 400px;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.8);
}
</style>
