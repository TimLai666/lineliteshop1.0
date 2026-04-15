<template>
    <div class="order-food-container">
        <!-- 頂部標題區域 -->
        <header class="header">
            <button @click="goToOrders" class="orders-btn" title="我的訂單">
                <span class="orders-icon">📝</span>
                <span class="orders-text">我的訂單</span>
            </button>
            <h1 class="title">🍔 線上點餐</h1>
            <div class="cart-summary" @click="showCart = true">
                <span class="cart-icon">🛒</span>
                <span class="cart-count" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
                <span class="cart-total">NT$ {{ cartTotal }}</span>
            </div>
        </header>

        <!-- 搜尋欄 -->
        <div class="search-section">
            <input v-model="searchKeyword" type="text" placeholder="搜尋商品..." class="search-input" @input="handleSearch">
        </div>

        <!-- 分類篩選 -->
        <div class="category-section">
            <div class="category-tabs">
                <button v-for="category in categories" :key="category"
                    :class="['category-tab', { active: selectedCategory === category }]"
                    @click="selectCategory(category)">
                    {{ category }}
                </button>
            </div>
        </div>

        <!-- 載入狀態 -->
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>載入中...</p>
        </div>

        <!-- 商品列表 -->
        <div v-else class="products-section">
            <div v-if="filteredProducts.length === 0" class="no-products">
                <p>😔 沒有找到商品</p>
            </div>
            <div v-else class="products-grid">
                <div v-for="product in filteredProducts" :key="product.name" :class="['product-card', {
                    'out-of-stock': product.stock === 0 && product.status === '暫時無法供貨',
                    'sold-out': product.stock === 0 && (!product.status || product.status === '已售完')
                }]">

                    <!-- 狀態標記 -->
                    <div v-if="product.stock === 0 || product.status === '暫時無法供貨'" class="status-badge">
                        <span v-if="product.status === '暫時無法供貨'" class="badge-unavailable">⚠️ 暫時無法供貨</span>
                        <span v-else-if="product.stock === 0" class="badge-sold-out">❌ 已售完</span>
                    </div>

                    <div class="product-image">
                        <img
                            v-if="product.image_url"
                            :src="product.image_url"
                            :alt="product.name"
                            loading="lazy"
                        />
                        <span v-else class="product-emoji">🍽️</span>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">{{ product.name }}</h3>
                        <p class="product-description">{{ product.description || '美味佳餚' }}</p>
                        <div class="product-meta">
                            <span class="product-category">{{ product.category || '其他' }}</span>
                            <span class="product-stock"
                                :class="{ 'low-stock': product.stock < 5 && product.stock > 0 }">
                                <span v-if="product.stock === 0 && product.status === '暫時無法供貨'"
                                    class="stock-unavailable">暫時缺貨</span>
                                <span v-else-if="product.stock === 0" class="stock-sold-out">已售完</span>
                                <span v-else>庫存: {{ product.stock }}</span>
                            </span>
                        </div>
                        <div class="product-footer">
                            <span class="product-price">NT$ {{ product.price }}</span>
                            <div class="quantity-controls">
                                <button class="quantity-btn" @click="decreaseQuantity(product)"
                                    :disabled="getProductQuantity(product) === 0">
                                    -
                                </button>
                                <span class="quantity">{{ getProductQuantity(product) }}</span>
                                <button class="quantity-btn" @click="increaseQuantity(product)"
                                    :disabled="product.stock === 0 || getProductQuantity(product) >= product.stock">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 購物車彈窗 -->
        <div v-if="showCart" class="cart-overlay" @click="showCart = false">
            <div class="cart-modal" @click.stop>
                <div class="cart-header">
                    <h2>🛒 購物車</h2>
                    <button class="close-btn" @click="showCart = false">✕</button>
                </div>

                <div class="cart-content">
                    <div v-if="cartItems.length === 0" class="empty-cart">
                        <p>購物車是空的</p>
                    </div>
                    <div v-else>
                        <div v-for="item in cartItems" :key="item.product.name" class="cart-item">
                            <div class="cart-item-info">
                                <h4>{{ item.product.name }}</h4>
                                <p class="cart-item-price">NT$ {{ item.product.price }} × {{ item.quantity }}</p>
                                <p v-if="item.product.stock === 0 && item.product.status === '暫時無法供貨'"
                                    class="cart-item-status unavailable">⚠️ 暫時無法供貨</p>
                                <p v-else-if="item.product.stock === 0" class="cart-item-status sold-out">❌ 已售完</p>
                                <p v-else-if="item.product.stock < 5" class="cart-item-status low-stock">⚠️ 庫存不足</p>
                            </div>
                            <div class="cart-item-controls">
                                <button @click="decreaseQuantity(item.product)">-</button>
                                <span>{{ item.quantity }}</span>
                                <button @click="increaseQuantity(item.product)"
                                    :disabled="item.product.stock === 0 || item.quantity >= item.product.stock">+</button>
                                <button @click="removeFromCart(item.product)" class="remove-btn">🗑️</button>
                            </div>
                        </div>

                        <div class="cart-summary-detail">
                            <div class="total-row">
                                <strong>總計: NT$ {{ cartTotal }}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cart-footer" v-if="cartItems.length > 0">
                    <div v-if="!isUserLoggedInAndReady()" class="login-warning">
                        <p>⚠️ 請先登入 LINE 帳號才能下訂單</p>
                        <button class="login-btn" @click="initializeLiff">重新登入</button>
                    </div>
                    <button v-else class="checkout-btn" @click="proceedToCheckout">
                        送出訂單 (NT$ {{ cartTotal }})
                    </button>
                </div>
            </div>
        </div>

        <!-- 結帳確認彈窗 -->
        <div v-if="showCheckout" class="checkout-overlay" @click="showCheckout = false">
            <div class="checkout-modal" @click.stop>
                <div class="checkout-header">
                    <h2>📝 確認訂單</h2>
                    <button class="close-btn" @click="showCheckout = false" :disabled="submitting">✕</button>
                </div>

                <div class="checkout-content">
                    <div class="user-info" v-if="profile">
                        <h3>訂購人資訊</h3>
                        <div class="user-card">
                            <img v-if="profile.pictureUrl" :src="profile.pictureUrl" alt="用戶頭像" class="user-avatar">
                            <div class="user-details">
                                <p class="user-name">{{ profile.displayName }}</p>
                                <p class="user-id">用戶ID: {{ profile.userId }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="order-summary">
                        <h3>訂單明細</h3>
                        <div v-for="item in cartItems" :key="item.product.name" class="order-item">
                            <span>{{ item.product.name }} × {{ item.quantity }}</span>
                            <span>NT$ {{ item.product.price * item.quantity }}</span>
                        </div>
                        <div class="order-total">
                            <strong>總計: NT$ {{ cartTotal }}</strong>
                        </div>
                    </div>

                    <div class="customer-info">
                        <h3>訂單資訊</h3>
                        <div class="form-group">
                            <label>備註:</label>
                            <textarea v-model="orderInfo.notes" placeholder="特殊需求或備註..." rows="3"></textarea>
                        </div>
                    </div>
                </div>

                <div class="checkout-footer">
                    <button class="cancel-btn" @click="showCheckout = false" :disabled="submitting">取消</button>
                    <button class="confirm-btn" @click="submitOrder" :disabled="submitting">
                        {{ submitting ? '處理中...' : '確認訂單' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 成功提示 -->
        <div v-if="showSuccess" class="success-overlay" @click="showSuccess = false">
            <div class="success-modal" @click.stop>
                <div class="success-content">
                    <div class="success-icon">✅</div>
                    <h2>訂單已成功送出！</h2>
                    <p>訂單編號: {{ orderNumber }}</p>
                    <p>預計等待時間: 15-20 分鐘</p>
                    <button class="success-btn" @click="resetOrder">繼續點餐</button>
                </div>
            </div>
        </div>

        <!-- 錯誤提示 -->
        <div v-if="showError" class="error-overlay" @click="showError = false">
            <div class="error-modal" @click.stop>
                <div class="error-content">
                    <div class="error-icon">❌</div>
                    <h2>發生錯誤</h2>
                    <p>{{ errorMessage }}</p>
                    <button class="error-btn" @click="showError = false">確定</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productApi } from '../services/productService.js'
import { orderApi } from '../services/orderService.js'
import { useLiff } from '../composables/useLiff.js'

// 響應式資料
const loading = ref(true)
const products = ref([])
const cartItems = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('全部')
const showCart = ref(false)
const showCheckout = ref(false)
const showSuccess = ref(false)
const submitting = ref(false)
const orderNumber = ref('')
const errorMessage = ref('')
const showError = ref(false)

// 路由
const router = useRouter()

// 初始化 LIFF
const {
    initializeLiff,
    profile,
    isLoggedIn,
    isReady,
    getUserId,
    hasValidProfile,
    isUserLoggedInAndReady
} = useLiff()

// 訂單資訊
const orderInfo = ref({
    notes: ''
})

// 分類選項
const categories = computed(() => {
    const cats = ['全部']
    const productCats = [...new Set(products.value.map(p => p.category).filter(cat => cat && cat.trim()))]
    // 如果有無分類的商品，添加"其他"分類
    const hasUncategorized = products.value.some(p => !p.category || !p.category.trim())
    if (hasUncategorized) {
        productCats.push('其他')
    }
    return cats.concat(productCats)
})

// 篩選後的商品
const filteredProducts = computed(() => {
    let filtered = products.value

    // 按分類篩選
    if (selectedCategory.value !== '全部') {
        if (selectedCategory.value === '其他') {
            // 顯示沒有分類或分類為空的商品
            filtered = filtered.filter(p => !p.category || !p.category.trim())
        } else {
            filtered = filtered.filter(p => p.category === selectedCategory.value)
        }
    }

    // 按搜尋關鍵字篩選
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.trim().toLowerCase()
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.description?.toLowerCase().includes(keyword) ||
            (p.category && p.category.toLowerCase().includes(keyword))
        )
    }

    // 只顯示未下架的商品（包括暫時無法供貨的商品）
    return filtered.filter(p => p.status !== '下架')
})

// 購物車相關計算屬性
const cartItemCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0)
})

const cartTotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
        return total + (item.product.price * item.quantity)
    }, 0)
})

// 方法
// 跳轉到我的訂單頁面
const goToOrders = () => {
    router.push({ name: 'MyOrders' })
}

const loadProducts = async () => {
    try {
        loading.value = true
        errorMessage.value = ''
        showError.value = false
        console.log('開始載入商品...')
        const response = await productApi.getAllProducts()
        console.log('API 回應商品:', response)

        // 檢查是否有回傳有效的商品資料
        if (response && Array.isArray(response) && response.length > 0) {
            console.log('使用 API 商品資料:', response.length, '個商品')
            // 過濾掉下架的商品，顯示有現貨或暫時無法供貨的商品
            products.value = response.filter(p => p.status !== '下架')
        } else {
            console.warn('API 沒有回傳商品資料')
            products.value = []
        }
    } catch (error) {
        console.error('載入商品失敗:', error)
        products.value = []
        errorMessage.value = error.message || '無法載入商品資料'
        showError.value = true
    } finally {
        loading.value = false
    }
}

const selectCategory = (category) => {
    selectedCategory.value = category
}

const getProductQuantity = (product) => {
    const item = cartItems.value.find(item => item.product.name === product.name)
    return item ? item.quantity : 0
}

const increaseQuantity = (product) => {
    const existingItem = cartItems.value.find(item => item.product.name === product.name)

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++
        }
    } else {
        cartItems.value.push({
            product: { ...product },
            quantity: 1
        })
    }
}

const decreaseQuantity = (product) => {
    const existingItem = cartItems.value.find(item => item.product.name === product.name)

    if (existingItem) {
        existingItem.quantity--
        if (existingItem.quantity === 0) {
            removeFromCart(product)
        }
    }
}

const removeFromCart = (product) => {
    const index = cartItems.value.findIndex(item => item.product.name === product.name)
    if (index > -1) {
        cartItems.value.splice(index, 1)
    }
}

const proceedToCheckout = () => {
    // 檢查用戶是否已登入
    if (!isUserLoggedInAndReady()) {
        errorMessage.value = '請先登入 LINE 帳號才能下訂單'
        showError.value = true
        return
    }

    // 檢查購物車是否有商品
    if (cartItems.value.length === 0) {
        errorMessage.value = '購物車是空的，請先加入商品'
        showError.value = true
        return
    }

    // 檢查商品庫存狀態
    const outOfStockItems = cartItems.value.filter(item =>
        item.product.stock === 0 || item.product.status === '暫時無法供貨'
    )

    if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => item.product.name).join(', ')
        errorMessage.value = `以下商品目前無法供應，請移除後再下訂單：${itemNames}`
        showError.value = true
        return
    }

    showCart.value = false
    showCheckout.value = true
}

const submitOrder = async () => {
    try {
        submitting.value = true

        // 檢查用戶是否已登入 LIFF
        if (!isUserLoggedInAndReady()) {
            throw new Error('請先登入 LINE 帳號')
        }

        const userId = getUserId()
        const userProfile = profile.value

        if (!userId || !userProfile) {
            throw new Error('無法取得用戶資訊')
        }

        // 準備訂單資料，符合後端 Order 模型
        const orderData = {
            customer_id: userId,
            customer_name: userProfile.displayName || '未知用戶',
            products: cartItems.value.map(item => ({
                product: item.product.name,
                quantity: item.quantity
            })),
            status: 'pending',
            time: new Date().toISOString(),
            total_amount: cartTotal.value,
            customer_note: orderInfo.value.notes || '',
        }

        console.log('準備提交訂單:', orderData)

        // 提交訂單到後端
        const response = await orderApi.createOrder(orderData)
        console.log('訂單提交成功:', response)

        orderNumber.value = response.order_id

        // 顯示成功畫面
        showCheckout.value = false
        showSuccess.value = true

    } catch (error) {
        console.error('提交訂單失敗:', error)

        // 顯示錯誤訊息給用戶
        errorMessage.value = error.message || '訂單提交失敗，請稍後再試'
        showError.value = true

        // 如果是因為用戶未登入，可以嘗試重新初始化 LIFF
        if (error.message.includes('登入')) {
            try {
                await initializeLiff()
            } catch (liffError) {
                console.error('重新初始化 LIFF 失敗:', liffError)
            }
        }
    } finally {
        submitting.value = false
    }
}

const resetOrder = () => {
    cartItems.value = []
    orderInfo.value = {
        notes: ''
    }
    showSuccess.value = false
    orderNumber.value = ''
}

// 生命週期
onMounted(async () => {
    // 初始化 LIFF
    try {
        await initializeLiff()
        console.log('LIFF 初始化成功')
    } catch (error) {
        console.error('LIFF 初始化失敗:', error)
    }

    // 載入商品資料
    loadProducts()
})
</script>

<style scoped>
.order-food-container {
    min-height: 100vh;
    background-color: var(--bg-100);
    padding: 0;
    margin: 0;
}

/* 頂部標題區域 */
.header {
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
}

.orders-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
}

.orders-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
}

.orders-icon {
    font-size: 16px;
}

.orders-text {
    white-space: nowrap;
}

.cart-summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.cart-summary:hover {
    background: rgba(255, 255, 255, 0.3);
}

.cart-icon {
    font-size: 1.2rem;
}

.cart-count {
    background: var(--accent-100);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
}

.cart-total {
    font-weight: 600;
}

/* 搜尋區域 */
.search-section {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid var(--bg-200);
}

.search-input {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid var(--bg-200);
    border-radius: 25px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s;
}

.search-input:focus {
    border-color: var(--primary-100);
}

/* 分類區域 */
.category-section {
    background: white;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--bg-200);
}

.category-tabs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
}

.category-tab {
    flex-shrink: 0;
    padding: 0.5rem 1rem;
    border: 2px solid var(--bg-200);
    background: white;
    color: var(--text-100);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.9rem;
    white-space: nowrap;
}

.category-tab.active {
    background: var(--primary-100);
    color: white;
    border-color: var(--primary-100);
}

.category-tab:hover:not(.active) {
    border-color: var(--primary-100);
    color: var(--primary-100);
}

/* 載入狀態 */
.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--bg-200);
    border-top: 4px solid var(--primary-100);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 商品區域 */
.products-section {
    padding: 1rem;
}

.no-products {
    text-align: center;
    padding: 4rem 1rem;
    color: var(--text-200);
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
}

.product-card {
    background: linear-gradient(135deg, #ffffff, #fafafa);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
    border: 1px solid var(--bg-200);
}

.product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-color: var(--primary-200);
}

/* 商品狀態相關樣式 */
.product-card.out-of-stock {
    opacity: 0.85;
    background: linear-gradient(135deg, rgba(3, 169, 244, 0.05), rgba(3, 169, 244, 0.1));
    border: 1px solid rgba(3, 169, 244, 0.2);
}

.product-card.sold-out {
    opacity: 0.8;
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.08), rgba(255, 152, 0, 0.12));
    border: 1px solid rgba(255, 193, 7, 0.3);
}

.status-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
}

.badge-unavailable,
.badge-sold-out {
    display: inline-block;
    padding: 0.3rem 0.6rem;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.badge-unavailable {
    background: var(--accent-100);
    border: 2px solid var(--accent-200);
}

.badge-sold-out {
    background: #ffc107;
    border: 2px solid #ff9800;
    color: #333;
}

.stock-unavailable {
    color: var(--accent-100);
    font-weight: 600;
}

.stock-sold-out {
    color: #ff9800;
    font-weight: 600;
}

.product-image {
    height: 120px;
    background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: relative;
    z-index: 1;
}

.product-image::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
}

.product-emoji {
    font-size: 3rem;
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.product-info {
    padding: 1rem;
}

.product-name {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-100);
}

.product-description {
    color: var(--text-200);
    font-size: 0.9rem;
    margin: 0 0 0.8rem 0;
    line-height: 1.4;
}

.product-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 0.8rem;
}

.product-category {
    background: var(--bg-200);
    color: var(--text-200);
    padding: 0.3rem 0.6rem;
    border-radius: 12px;
}

.product-stock {
    color: var(--text-200);
}

.product-stock.low-stock {
    color: var(--accent-100);
    font-weight: 600;
    background: rgba(3, 169, 244, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
    border: 1px solid rgba(3, 169, 244, 0.3);
}

.product-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.product-price {
    font-size: 1.3rem;
    font-weight: bold;
    color: var(--primary-100);
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    border-radius: 50%;
    border: 2px solid var(--primary-100);
    background: white;
    color: var(--primary-100);
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    padding: 0;
    line-height: 1;
}

.quantity-btn:hover:not(:disabled) {
    background: var(--primary-100);
    color: white;
}

.quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.quantity {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
    font-size: 1.1rem;
}

/* 彈窗樣式 */
.cart-overlay,
.checkout-overlay,
.success-overlay,
.error-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.cart-modal,
.checkout-modal,
.success-modal,
.error-modal {
    background: white;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.cart-header,
.checkout-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--bg-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cart-header h2,
.checkout-header h2 {
    margin: 0;
    color: var(--text-100);
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-200);
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s;
}

.close-btn:hover {
    background: var(--bg-200);
}

.close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-200);
}

.cart-content,
.checkout-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.empty-cart {
    text-align: center;
    padding: 2rem;
    color: var(--text-200);
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--bg-200);
}

.cart-item:last-child {
    border-bottom: none;
}

.cart-item-info h4 {
    margin: 0 0 0.3rem 0;
    color: var(--text-100);
}

.cart-item-price {
    margin: 0;
    color: var(--text-200);
    font-size: 0.9rem;
}

.cart-item-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.cart-item-controls button {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    border-radius: 50%;
    border: 2px solid var(--primary-100);
    background: white;
    color: var(--primary-100);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: bold;
    padding: 0;
    line-height: 1;
    transition: all 0.3s;
}

.cart-item-controls button:hover:not(:disabled) {
    background: var(--primary-100);
    color: white;
}

.cart-item-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: var(--bg-200);
    color: var(--bg-200);
}

.remove-btn {
    background: var(--primary-100) !important;
    color: white !important;
    border-color: var(--primary-100) !important;
}

.cart-summary-detail {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 2px solid var(--bg-200);
}

.total-row {
    text-align: right;
    font-size: 1.2rem;
    color: var(--primary-100);
}

.cart-footer,
.checkout-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--bg-200);
}

.checkout-btn {
    width: 100%;
    padding: 1rem;
    background: var(--primary-100);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.checkout-btn:hover {
    background: var(--primary-200);
}

/* 結帳表單 */
.order-summary {
    margin-bottom: 2rem;
}

.order-summary h3 {
    margin: 0 0 1rem 0;
    color: var(--text-100);
}

.order-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bg-200);
}

.order-total {
    padding: 1rem 0;
    margin-top: 1rem;
    border-top: 2px solid var(--bg-200);
    text-align: right;
    font-size: 1.2rem;
    color: var(--primary-100);
}

.customer-info h3 {
    margin: 0 0 1rem 0;
    color: var(--text-100);
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-100);
}

.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid var(--bg-200);
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s;
}

.form-group select:focus,
.form-group textarea:focus {
    border-color: var(--primary-100);
}

.checkout-footer {
    display: flex;
    gap: 1rem;
}

.cancel-btn,
.confirm-btn {
    flex: 1;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.cancel-btn {
    background: var(--bg-200);
    color: var(--text-100);
}

.cancel-btn:hover {
    background: var(--bg-300);
}

.cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--bg-200);
}

.confirm-btn {
    background: var(--primary-100);
    color: white;
}

.confirm-btn:hover:not(:disabled) {
    background: var(--primary-200);
}

.confirm-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 成功彈窗 */
.success-content,
.error-content {
    padding: 3rem 2rem;
    text-align: center;
}

.success-icon,
.error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.success-content h2,
.error-content h2 {
    color: var(--primary-100);
    margin: 0 0 1rem 0;
}

.error-content h2 {
    color: #f44336;
}

.success-content p,
.error-content p {
    color: var(--text-200);
    margin: 0.5rem 0;
}

.success-btn,
.error-btn {
    margin-top: 2rem;
    padding: 1rem 2rem;
    background: var(--primary-100);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.error-btn {
    background: #f44336;
}

.success-btn:hover {
    background: var(--primary-200);
}

.error-btn:hover {
    background: #d32f2f;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .products-grid {
        grid-template-columns: 1fr;
    }

    .cart-modal,
    .checkout-modal {
        margin: 0.5rem;
        width: calc(100% - 1rem);
    }

    .checkout-footer {
        flex-direction: column;
    }

    .header {
        padding: 0.8rem;
    }

    .title {
        font-size: 1.3rem;
    }

    .orders-btn {
        padding: 6px 8px;
        font-size: 12px;
        gap: 4px;
    }

    .orders-text {
        display: none;
    }

    .orders-icon {
        font-size: 18px;
    }
}

.cart-item-status {
    font-size: 0.8rem;
    margin: 0.2rem 0 0 0;
    font-weight: 600;
}

.cart-item-status.unavailable {
    color: var(--accent-100);
}

.cart-item-status.sold-out {
    color: #ff9800;
}

.cart-item-status.low-stock {
    color: var(--accent-200);
}

/* 登入警告 */
.login-warning {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 8px;
    margin-bottom: 1rem;
}

.login-warning p {
    margin: 0 0 0.5rem 0;
    color: #ff9800;
    font-weight: 600;
}

.login-btn {
    padding: 0.5rem 1rem;
    background: #ff9800;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.login-btn:hover {
    background: #f57c00;
}

/* 用戶資訊 */
.user-info {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--bg-200);
}

.user-info h3 {
    margin: 0 0 1rem 0;
    color: var(--text-100);
}

.user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-100);
    border-radius: 8px;
    border: 1px solid var(--bg-200);
}

.user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--primary-100);
}

.user-details {
    flex: 1;
}

.user-name {
    margin: 0 0 0.3rem 0;
    font-weight: 600;
    color: var(--text-100);
}

.user-id {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-200);
}
</style>
