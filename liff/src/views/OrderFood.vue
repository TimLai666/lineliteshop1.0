<template>
    <div class="order-food-container">
        <!-- 頂部標題區域 -->
        <header class="header">
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
                        <span class="product-emoji">🍽️</span>
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
                    <button class="checkout-btn" @click="proceedToCheckout">
                        結帳 (NT$ {{ cartTotal }})
                    </button>
                </div>
            </div>
        </div>

        <!-- 結帳確認彈窗 -->
        <div v-if="showCheckout" class="checkout-overlay" @click="showCheckout = false">
            <div class="checkout-modal" @click.stop>
                <div class="checkout-header">
                    <h2>📝 確認訂單</h2>
                    <button class="close-btn" @click="showCheckout = false">✕</button>
                </div>

                <div class="checkout-content">
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
                        <h3>取餐資訊</h3>
                        <div class="form-group">
                            <label>取餐方式:</label>
                            <select v-model="orderInfo.pickupMethod">
                                <option value="store">店內取餐</option>
                                <option value="delivery">外送</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>備註:</label>
                            <textarea v-model="orderInfo.notes" placeholder="特殊需求或備註..." rows="3"></textarea>
                        </div>
                    </div>
                </div>

                <div class="checkout-footer">
                    <button class="cancel-btn" @click="showCheckout = false">取消</button>
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { productApi } from '../services/productService.js'
import { orderApi } from '../services/orderService.js'

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

// 訂單資訊
const orderInfo = ref({
    pickupMethod: 'store',
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
const loadProducts = async () => {
    try {
        loading.value = true
        console.log('開始載入商品...')
        const response = await productApi.getAllProducts()
        console.log('API 回應商品:', response)

        // 檢查是否有回傳有效的商品資料
        if (response && Array.isArray(response) && response.length > 0) {
            console.log('使用 API 商品資料:', response.length, '個商品')
            // 過濾掉下架的商品，顯示有現貨或暫時無法供貨的商品
            products.value = response.filter(p => p.status !== '下架')
        } else {
            console.log('API 沒有回傳商品資料，使用模擬資料')
            // 模擬商品資料 (如果 API 沒有回傳資料)
            products.value = [
                {
                    name: '經典漢堡',
                    category: '主餐',
                    price: 120,
                    stock: 15,
                    description: '牛肉漢堡搭配新鮮蔬菜',
                    status: 'available'
                },
                {
                    name: '炸雞套餐',
                    category: '主餐',
                    price: 150,
                    stock: 12,
                    description: '酥脆炸雞配薯條',
                    status: 'available'
                },
                {
                    name: '義大利麵',
                    category: '主餐',
                    price: 180,
                    stock: 8,
                    description: '奶油白醬義大利麵',
                    status: 'available'
                },
                {
                    name: '可樂',
                    category: '飲料',
                    price: 25,
                    stock: 30,
                    description: '冰涼可口可樂',
                    status: 'available'
                },
                {
                    name: '珍珠奶茶',
                    category: '飲料',
                    price: 45,
                    stock: 20,
                    description: '香濃奶茶配Q彈珍珠',
                    status: 'available'
                },
                {
                    name: '薯條',
                    category: '小食',
                    price: 60,
                    stock: 25,
                    description: '金黃酥脆薯條',
                    status: 'available'
                },
                {
                    name: '雞塊',
                    category: '小食',
                    price: 80,
                    stock: 18,
                    description: '香嫩雞塊6塊裝',
                    status: 'available'
                },
                {
                    name: '巧克力蛋糕',
                    category: '甜點',
                    price: 90,
                    stock: 6,
                    description: '濃郁巧克力蛋糕',
                    status: 'available'
                }
            ]
        }
    } catch (error) {
        console.error('載入商品失敗:', error)
        // 如果 API 失敗，使用模擬資料
        products.value = [
            {
                name: '經典漢堡',
                category: '主餐',
                price: 120,
                stock: 15,
                description: '牛肉漢堡搭配新鮮蔬菜',
                status: 'available'
            },
            {
                name: '炸雞套餐',
                category: '主餐',
                price: 150,
                stock: 12,
                description: '酥脆炸雞配薯條',
                status: 'available'
            }
        ]
    } finally {
        loading.value = false
    }
}

const selectCategory = (category) => {
    selectedCategory.value = category
}

const handleSearch = () => {
    // 搜尋功能已通過 computed 屬性實現
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
    showCart.value = false
    showCheckout.value = true
}

const submitOrder = async () => {
    try {
        submitting.value = true

        const orderData = {
            items: cartItems.value.map(item => ({
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            })),
            total: cartTotal.value,
            pickupMethod: orderInfo.value.pickupMethod,
            notes: orderInfo.value.notes,
            orderTime: new Date().toISOString()
        }

        // 嘗試提交訂單
        const response = await orderApi.createOrder(orderData)

        // 生成訂單編號 (模擬)
        orderNumber.value = `ORD${Date.now().toString().slice(-6)}`

        // 顯示成功畫面
        showCheckout.value = false
        showSuccess.value = true

    } catch (error) {
        console.error('提交訂單失敗:', error)
        // 即使 API 失敗也顯示成功 (Demo 用途)
        orderNumber.value = `ORD${Date.now().toString().slice(-6)}`
        showCheckout.value = false
        showSuccess.value = true
    } finally {
        submitting.value = false
    }
}

const resetOrder = () => {
    cartItems.value = []
    orderInfo.value = {
        pickupMethod: 'store',
        notes: ''
    }
    showSuccess.value = false
    orderNumber.value = ''
}

// 生命週期
onMounted(() => {
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
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
}

/* 商品狀態相關樣式 */
.product-card.out-of-stock {
    opacity: 0.8;
    background: #f8f9fa;
}

.product-card.sold-out {
    opacity: 0.7;
    background: #f5f5f5;
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
    background: #ff9800;
    border: 2px solid #f57c00;
}

.badge-sold-out {
    background: #f44336;
    border: 2px solid #d32f2f;
}

.stock-unavailable {
    color: #ff9800;
    font-weight: 600;
}

.stock-sold-out {
    color: #f44336;
    font-weight: 600;
}

.product-image {
    height: 120px;
    background: linear-gradient(135deg, var(--primary-300), var(--primary-200));
    display: flex;
    align-items: center;
    justify-content: center;
}

.product-emoji {
    font-size: 3rem;
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
    color: #ff9800;
    font-weight: 600;
    background: rgba(255, 152, 0, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 152, 0, 0.3);
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
.success-overlay {
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
.success-modal {
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
    border: 1px solid var(--bg-200);
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    padding: 0;
    line-height: 1;
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
.success-content {
    padding: 3rem 2rem;
    text-align: center;
}

.success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.success-content h2 {
    color: var(--primary-100);
    margin: 0 0 1rem 0;
}

.success-content p {
    color: var(--text-200);
    margin: 0.5rem 0;
}

.success-btn {
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

.success-btn:hover {
    background: var(--primary-200);
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
}

.cart-item-status {
    font-size: 0.8rem;
    margin: 0.2rem 0 0 0;
    font-weight: 600;
}

.cart-item-status.unavailable {
    color: #ff9800;
}

.cart-item-status.sold-out {
    color: #f44336;
}

.cart-item-status.low-stock {
    color: #ff9800;
}
</style>
