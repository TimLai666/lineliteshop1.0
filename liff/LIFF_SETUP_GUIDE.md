# LIFF 設定指南

## 🔍 問題診斷

### 常見的 LIFF ID 問題
1. **LIFF ID 格式錯誤** - 正確格式應該是 `1234567890-AbcDefGh`
2. **LIFF 應用程式未正確設定**
3. **權限範圍 (Scope) 設定不正確**
4. **測試環境問題**

## 📋 正確設定 LIFF 的步驟

### 1. 建立 LIFF 應用程式
1. 登入 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Channel (Messaging API 或 LINE Login)
3. 點選 "LIFF" 分頁
4. 點選 "Add" 建立新的 LIFF 應用程式

### 2. LIFF 設定參數
```
LIFF app name: LineLiteShop
Size: Full
Endpoint URL: https://your-domain.com (或 ngrok URL)
Scope: profile (必須選擇)
Bot link feature: On (可選)
```

### 3. 取得正確的 LIFF ID
建立完成後，你會得到一個類似這樣的 LIFF ID：
```
1234567890-AbcDefGh
```

### 4. 更新程式碼中的 LIFF ID
在 `UserRegister.vue` 中更新：
```javascript
await liff.init({
    liffId: '你的實際LIFF-ID' // 替換這裡
})
```

## 🔧 調試和測試

### 1. 本地開發環境
- 使用 ngrok 提供 HTTPS URL
- 將 ngrok URL 設定為 LIFF 的 Endpoint URL

### 2. 手機測試
- 在 LINE 中開啟 LIFF URL: `https://liff.line.me/你的LIFF-ID`
- 或使用 LINE 官方的 LIFF Inspector: `https://liff-inspector.line.me/`

### 3. 查看 Console 輸出
開啟瀏覽器的開發者工具，檢查：
- LIFF 初始化是否成功
- 是否有錯誤訊息
- 登入狀態是否正確

## 🚨 常見錯誤解決

### INVALID_CONFIG 錯誤
- LIFF ID 格式不正確
- LIFF 應用程式不存在

### UNAUTHORIZED 錯誤
- 權限設定問題
- Channel 設定問題

### 無法取得用戶資料
- 檢查 Scope 是否包含 `profile`
- 確認用戶已經登入 LINE

## 📱 手機滿版設定

已在 CSS 中加入以下設定：
```css
@media (max-width: 600px) {
    .register-container {
        padding: 0;
        align-items: flex-start;
    }
    
    .register-card {
        border-radius: 0;
        min-height: 100vh;
        width: 100vw;
        max-width: none;
    }
}
```

## 🎯 下一步

1. **設定正確的 LIFF ID**
2. **使用 ngrok 提供 HTTPS URL**
3. **在 LINE 中測試 LIFF 應用程式**
4. **檢查 Console 輸出確認狀態**

## 💡 提示

- LIFF 應用程式只能在 HTTPS 環境下運行
- 本地開發建議使用 ngrok
- 測試時請使用實際的 LINE 應用程式，不是網頁版
