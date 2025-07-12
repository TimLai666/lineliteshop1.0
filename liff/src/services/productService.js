// 基礎 API URL 設定
const BASE_URL = '/api/data'

// 通用 fetch 函數
const fetchApi = async (url, options = {}) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    }

    try {
        const response = await fetch(`${BASE_URL}${url}`, config)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        // 檢查回應的內容類型
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error('Expected JSON but received:', text.substring(0, 200))
            throw new Error('伺服器回傳了非JSON格式的資料')
        }

        return await response.json()
    } catch (error) {
        console.error('Fetch API error:', error)
        console.error('Request URL:', `${BASE_URL}${url}`)
        throw error
    }
}

// 商品相關 API
export const productApi = {
    // 獲取所有商品
    async getAllProducts() {
        try {
            console.log('正在呼叫 API:', `${BASE_URL}/products`)
            const response = await fetchApi('/products')
            console.log('API 回應:', response)

            // 處理後端回傳的 {data: [...]} 格式
            if (response && response.data && Array.isArray(response.data)) {
                console.log('找到商品資料:', response.data.length, '個商品')
                return response.data
            }
            console.warn('商品資料格式不正確:', response)
            return []
        } catch (error) {
            console.error('獲取商品列表失敗:', error)
            throw new Error('無法載入商品資料')
        }
    },

    // 獲取單一商品詳情
    async getProductByName(productName) {
        try {
            // 注意：這個端點可能需要調整，因為後端沒有對應的路由
            const response = await fetchApi(`/product/${productName}`)
            return response
        } catch (error) {
            console.error('獲取商品詳情失敗:', error)
            throw new Error('無法載入商品詳情')
        }
    },    // 搜尋商品
    // todo: 增加搜尋功能 - 後端尚未實作此端點
    async searchProducts(keyword) {
        try {
            // 暫時通過獲取所有商品然後在前端過濾
            const allProducts = await productApi.getAllProducts()

            if (!allProducts || !Array.isArray(allProducts)) {
                return []
            }

            return allProducts.filter(product =>
                product.name?.toLowerCase().includes(keyword.toLowerCase()) ||
                product.description?.toLowerCase().includes(keyword.toLowerCase())
            )
        } catch (error) {
            console.error('搜尋商品失敗:', error)
            throw new Error('搜尋失敗，請稍後再試')
        }
    },

    // 獲取分類商品
    // todo: 增加分類功能 - 後端尚未實作此端點
    async getProductsByCategory(category) {
        try {
            // 暫時通過獲取所有商品然後在前端過濾
            const allProducts = await productApi.getAllProducts()

            if (!allProducts || !Array.isArray(allProducts)) {
                return []
            }

            return allProducts.filter(product =>
                product.category === category
            )
        } catch (error) {
            console.error('獲取分類商品失敗:', error)
            throw new Error('無法載入分類商品')
        }
    }
}
