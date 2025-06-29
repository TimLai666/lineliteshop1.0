# API 服務架構說明

## 📁 資料夾結構
```
src/
├── services/           # API 服務層
│   ├── api.js         # 基礎 HTTP 請求服務
│   ├── userService.js # 用戶相關 API
│   ├── productService.js # 商品相關 API
│   ├── orderService.js   # 訂單相關 API
│   └── index.js       # 統一匯出入口
├── composables/       # Vue 3 Composables
│   └── useApi.js      # API 狀態管理
└── views/
    └── UserRegister.vue # 已更新使用新 API
```

## 🔧 使用方式

### 1. 基本使用（在 Vue 組件中）
```javascript
import { userApi, handleApiError } from '@/services'

// 在 setup() 函數中
const handleRegister = async () => {
  try {
    const result = await userApi.register(userData)
    console.log('註冊成功:', result)
  } catch (error) {
    console.error('註冊失敗:', handleApiError(error))
  }
}
```

### 2. 使用 Composable（推薦）
```javascript
import { useUserApi } from '@/composables/useApi'

// 在 setup() 函數中
const { loading, error, register, hasError } = useUserApi()

const handleRegister = async () => {
  try {
    await register(userData)
    // 成功處理
  } catch (error) {
    // 錯誤已經在 composable 中處理
  }
}
```

### 3. 統一 API 物件使用
```javascript
import { api } from '@/services'

// 用戶相關
await api.user.register(userData)
await api.user.checkUserExists(lineUserId)

// 商品相關
await api.product.getAllProducts()
await api.product.getProductById(productId)

// 訂單相關
await api.order.createOrder(orderData)
await api.order.getUserOrders(lineUserId)
```

## ⚙️ 配置設定

### 應用程式配置 (src/config/index.js)

所有配置現在統一在 `src/config/index.js` 中管理：

```javascript
export const config = {
    isDevelopment: import.meta.env.DEV,
    api: {
        baseUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
    },
    liff: {
        id: '2007661588-kJDbPzDw'
    }
}
```

- **開發/生產模式判斷**: 自動根據 Vite 的 `import.meta.env.DEV` 判斷
- **API 設定**: 統一管理 API 基礎 URL
- **LIFF 設定**: 統一管理 LIFF ID

### Google Apps Script 端點格式
所有 API 請求都會送到同一個端點，透過 `action` 參數區分：

```javascript
// 範例：用戶註冊
POST: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
Body: {
  "action": "registerUser",
  "lineUserId": "U1234567890",
  "displayName": "測試用戶",
  "phone": "0912345678",
  "email": "test@example.com"
}
```

## 🎯 優點

1. **集中管理**: 所有 API 邏輯集中在 services 資料夾
2. **型別安全**: 清楚的函數介面和錯誤處理
3. **可重用性**: 可在任何組件中輕鬆使用
4. **狀態管理**: Composable 提供載入狀態和錯誤處理
5. **環境配置**: 支援開發/生產環境不同設定
6. **錯誤處理**: 統一的錯誤處理機制

## 📝 更新紀錄

- ✅ 建立基礎 API 服務架構
- ✅ 分離用戶、商品、訂單 API
- ✅ 建立 Vue 3 Composable 支援
- ✅ 更新 UserRegister.vue 使用新架構
- ✅ 設定環境變數管理
