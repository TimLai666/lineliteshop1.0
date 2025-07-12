// 應用程式配置
export const config = {
    // 判斷是否為開發模式
    isDevelopment: import.meta.env.DEV,

    // LIFF 設定
    liff: {
        id: '2007661588-kJDbPzDw'
    }
}

// 環境相關的輔助函數
export const isDev = () => config.isDevelopment
export const isProd = () => !config.isDevelopment

// 獲取 LIFF ID
export const getLiffId = () => config.liff.id
