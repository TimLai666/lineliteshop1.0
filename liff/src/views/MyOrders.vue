<template>
    <div class="my-orders-container">
        <!-- 頂部標題區域 -->
        <header class="header">
            <button @click="goBack" class="back-btn">
                <span class="back-icon">←</span>
            </button>
            <h1 class="title">📝 我的訂單</h1>
            <div class="header-spacer"></div>
        </header>

        <!-- 載入狀態 -->
        <LoadingSpinner v-if="loading" message="正在載入訂單資料..." />

        <!-- 訂單狀態篩選 -->
        <div v-else class="filter-section">
            <div class="status-tabs">
                <button v-for="status in orderStatuses" :key="status.value"
                    :class="['status-tab', { active: selectedStatus === status.value }]"
                    @click="selectStatus(status.value)">
                    {{ status.label }}
                </button>
            </div>
        </div>

        <!-- 訂單列表 -->
        <div v-if="!loading" class="orders-section">
            <div v-if="filteredOrders.length === 0" class="no-orders">
                <div class="empty-icon">📭</div>
                <h3>沒有訂單記錄</h3>
                <p v-if="selectedStatus === 'all'">您還沒有任何訂單，快去點餐吧！</p>
                <p v-else>目前沒有{{ getStatusLabel(selectedStatus) }}的訂單</p>
                <button @click="goToOrder" class="order-btn">
                    <span class="btn-icon">🍔</span>
                    開始點餐
                </button>
            </div>

            <div v-else class="orders-list">
                <div v-for="order in filteredOrders" :key="order.orderId" class="order-card">
                    <!-- 訂單標題 -->
                    <div class="order-header">
                        <div class="order-info">
                            <h3 class="order-id">訂單 #{{ order.orderId }}</h3>
                            <p class="order-date">{{ order.customer_name || '未知客戶' }}</p>
                            <p class="order-time" v-if="order.orderTime">{{ formatDateTime(order.orderTime) }}</p>
                        </div>
                        <div class="order-status">
                            <span :class="['status-badge', getStatusClass(order.status)]">
                                {{ getStatusText(order.status) }}
                            </span>
                        </div>
                    </div>

                    <!-- 訂單商品列表 -->
                    <div class="order-items">
                        <div v-for="(item, index) in order.items" :key="index" class="order-item">
                            <div class="item-info">
                                <span class="item-name">{{ item.product || '未知商品' }}</span>
                                <span class="item-quantity">x{{ item.quantity > 0 ? item.quantity : 1 }}</span>
                                <span v-if="item.quantity === 0" class="quantity-warning">(數量異常)</span>
                            </div>
                            <div class="item-price">
                                NT$ {{ (item.price || 0) * (item.quantity || 1) }}
                            </div>
                        </div>
                    </div>

                    <!-- 訂單總額和操作 -->
                    <div class="order-footer">
                        <div class="order-total">
                            <span class="total-label">總計：</span>
                            <span class="total-amount">NT$ {{ order.totalAmount }}</span>
                        </div>
                        <div class="order-actions">
                            <button @click="viewOrderDetail(order)" class="detail-btn">
                                查看詳情
                            </button>
                            <button v-if="canCancelOrder(order.status)" @click="cancelOrder(order)" class="cancel-btn">
                                取消訂單
                            </button>
                            <button v-if="canReorder(order.status)" @click="reorder(order)" class="reorder-btn">
                                再次訂購
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 訂單詳情彈窗 -->
        <div v-if="showOrderDetail" class="modal-overlay" @click="closeOrderDetail">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>訂單詳情</h3>
                    <button @click="closeOrderDetail" class="close-btn">×</button>
                </div>
                <div class="modal-body" v-if="selectedOrder">
                    <div class="detail-section">
                        <h4>訂單資訊</h4>
                        <div class="detail-row">
                            <span class="detail-label">訂單編號：</span>
                            <span class="detail-value">{{ selectedOrder.orderId }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">客戶名稱：</span>
                            <span class="detail-value">{{ selectedOrder.customer_name || '未知客戶' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">訂單時間：</span>
                            <span class="detail-value">{{ selectedOrder.orderTime ?
                                formatDateTime(selectedOrder.orderTime) : '未知時間' }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">訂單狀態：</span>
                            <span :class="['detail-value', 'status-text', getStatusClass(selectedOrder.status)]">
                                {{ getStatusText(selectedOrder.status) }}
                            </span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>商品清單</h4>
                        <div v-for="(item, index) in selectedOrder.items" :key="index" class="detail-item">
                            <div class="detail-item-info">
                                <span class="detail-item-name">{{ item.product || '未知商品' }}</span>
                                <span class="detail-item-quantity">x{{ item.quantity > 0 ? item.quantity : 1 }}</span>
                                <span v-if="item.quantity === 0" class="quantity-warning">(數量異常)</span>
                            </div>
                            <span class="detail-item-price">NT$ {{ (item.price || 0) * (item.quantity || 1) }}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>付款資訊</h4>
                        <div class="detail-row">
                            <span class="detail-label">商品小計：</span>
                            <span class="detail-value">NT$ {{ selectedOrder.totalAmount }}</span>
                        </div>
                        <div class="detail-row total-row">
                            <span class="detail-label">總金額：</span>
                            <span class="detail-value">NT$ {{ selectedOrder.totalAmount }}</span>
                        </div>
                    </div>

                    <div v-if="selectedOrder.notes" class="detail-section">
                        <h4>備註</h4>
                        <p class="detail-notes">{{ selectedOrder.notes }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 取消訂單確認彈窗 -->
        <div v-if="showCancelConfirm" class="modal-overlay" @click="closeCancelConfirm">
            <div class="modal-content confirm-modal" @click.stop>
                <div class="modal-header">
                    <h3>取消訂單</h3>
                    <button @click="closeCancelConfirm" class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <p>確定要取消這筆訂單嗎？</p>
                    <p class="warning-text">取消後將無法復原</p>

                    <div class="form-group">
                        <label for="cancelReason">取消原因：</label>
                        <textarea v-model="cancelReason" id="cancelReason" placeholder="請說明取消原因..."
                            class="cancel-reason-input">
                        </textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="closeCancelConfirm" class="cancel-btn-secondary">取消</button>
                    <button @click="confirmCancelOrder" :disabled="cancelling || !cancelReason.trim()"
                        class="confirm-btn">
                        {{ cancelling ? '處理中...' : '確認取消' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 消息提示 -->
        <MessageAlert v-if="alertMessage" :message="alertMessage.message" :type="alertMessage.type" :visible="true"
            @close="clearAlert" />

        <!-- 調試面板 -->
        <!-- <LiffDebugPanel /> -->
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import MessageAlert from '../components/MessageAlert.vue'
import LiffDebugPanel from '../components/LiffDebugPanel.vue'
import { orderApi, handleApiError } from '../services/index.js'
import { useLiff } from '../composables/useLiff.js'

// 路由
const router = useRouter()

// 使用全局 LIFF 狀態
const { profile } = useLiff()

// 組件狀態
const loading = ref(true)
const orders = ref([])
const selectedStatus = ref('all')
const showOrderDetail = ref(false)
const selectedOrder = ref(null)
const showCancelConfirm = ref(false)
const orderToCancel = ref(null)
const cancelReason = ref('')
const cancelling = ref(false)
const alertMessage = ref(null)

// 訂單狀態選項
const orderStatuses = ref([
    { value: 'all', label: '全部' },
    { value: '待處理', label: '待處理' },
    { value: '進行中', label: '製作中' },
    { value: '已完成', label: '已完成' },
    { value: '取消', label: '已取消' }
])

// 計算屬性
const filteredOrders = computed(() => {
    if (selectedStatus.value === 'all') {
        return orders.value
    }

    // 對狀態進行標準化比較（去除空格，統一格式）
    return orders.value.filter(order => {
        const orderStatus = (order.status || '').toString().trim()
        const selected = selectedStatus.value.trim()

        // 調試信息
        console.log('篩選比較:', {
            orderStatus,
            selected,
            match: orderStatus === selected
        })

        return orderStatus === selected
    })
})

// 載入訂單資料
const loadOrders = async () => {
    if (!profile.value?.userId) {
        console.error('無法獲取用戶資訊')
        showAlert('無法獲取用戶資訊', 'error')
        return
    }

    try {
        loading.value = true
        console.log('正在載入訂單資料...')

        const orderData = await orderApi.getUserOrders(profile.value.userId)
        console.log('載入的訂單資料:', orderData)

        // 處理新的資料結構 { data: [...], message, status }
        if (orderData && orderData.data && Array.isArray(orderData.data)) {
            orders.value = orderData.data.map(order => ({
                ...order,
                orderId: order.id, // 將 id 映射為 orderId
                items: order.products || [], // 將 products 映射為 items
                totalAmount: order.total_amount, // 使用後端返回的總金額
                orderTime: order.time, // 訂單時間
                status: (order.status || '').toString().trim() // 標準化狀態值
            })).sort((a, b) => {
                const ta = a.orderTime ? new Date(a.orderTime).getTime() : 0
                const tb = b.orderTime ? new Date(b.orderTime).getTime() : 0
                return tb - ta // 依照訂單時間降序（新的在前）
            })
        } else if (Array.isArray(orderData)) {
            orders.value = orderData.map(order => ({
                ...order,
                orderId: order.id,
                items: order.products || [],
                totalAmount: order.totalAmount,
                orderTime: order.time
            })).sort((a, b) => {
                const ta = a.orderTime ? new Date(a.orderTime).getTime() : 0
                const tb = b.orderTime ? new Date(b.orderTime).getTime() : 0
                return tb - ta // 依照訂單時間降序（新的在前）
            })
        } else {
            orders.value = []
        }

        console.log('處理後的訂單列表:', orders.value)

    } catch (error) {
        console.error('載入訂單失敗:', error)
        showAlert(handleApiError(error, '載入訂單失敗'), 'error')
        orders.value = []
    } finally {
        loading.value = false
    }
}

// 選擇狀態篩選
const selectStatus = (status) => {
    selectedStatus.value = status
}

// 查看訂單詳情
const viewOrderDetail = (order) => {
    selectedOrder.value = order
    showOrderDetail.value = true
}

// 關閉訂單詳情
const closeOrderDetail = () => {
    showOrderDetail.value = false
    selectedOrder.value = null
}

// 取消訂單
const cancelOrder = (order) => {
    orderToCancel.value = order
    cancelReason.value = ''
    showCancelConfirm.value = true
}

// 關閉取消確認彈窗
const closeCancelConfirm = () => {
    showCancelConfirm.value = false
    orderToCancel.value = null
    cancelReason.value = ''
}

// 確認取消訂單
const confirmCancelOrder = async () => {
    if (!cancelReason.value.trim()) {
        showAlert('請填寫取消原因', 'error')
        return
    }

    try {
        cancelling.value = true

        await orderApi.cancelOrder(orderToCancel.value.orderId, cancelReason.value.trim())

        // 更新本地訂單狀態
        const orderIndex = orders.value.findIndex(o => o.orderId === orderToCancel.value.orderId)
        if (orderIndex !== -1) {
            orders.value[orderIndex].status = 'cancelled'
        }

        showAlert('訂單已成功取消', 'success')
        closeCancelConfirm()

    } catch (error) {
        console.error('取消訂單失敗:', error)
        showAlert(handleApiError(error, '取消訂單失敗'), 'error')
    } finally {
        cancelling.value = false
    }
}

// 再次訂購
const reorder = (order) => {
    // 這裡可以將訂單商品加入購物車，然後跳轉到點餐頁面
    console.log('再次訂購:', order)
    showAlert('功能開發中...', 'info')
}

// 返回到點餐頁面
const goBack = () => {
    router.push({ name: 'OrderFood' })
}

// 跳轉到點餐頁面
const goToOrder = () => {
    router.push({ name: 'OrderFood' })
}

// 工具函數
const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getStatusText = (status) => {
    // 標準化狀態值（去除空格）
    const normalizedStatus = (status || '').toString().trim()
    return normalizedStatus || '未知狀態'
}

const getStatusClass = (status) => {
    // 標準化狀態值
    const normalizedStatus = (status || '').toString().trim()

    // 根據中文狀態返回對應的 CSS 類
    const classMap = {
        '待處理': 'status-pending',
        '已確認': 'status-confirmed',
        '製作中': 'status-preparing',
        '已完成': 'status-ready',
        '已送達': 'status-delivered',
        '已取消': 'status-cancelled'
    }
    return classMap[normalizedStatus] || 'status-pending'
}

const getStatusLabel = (status) => {
    const statusObj = orderStatuses.value.find(s => s.value === status)
    return statusObj ? statusObj.label : status
}

const canCancelOrder = (status) => {
    const normalizedStatus = (status || '').toString().trim()
    return ['待處理', '已確認'].includes(normalizedStatus)
}

const canReorder = (status) => {
    const normalizedStatus = (status || '').toString().trim()
    return ['已完成', '已送達', '已取消'].includes(normalizedStatus)
}

const showAlert = (message, type = 'info') => {
    alertMessage.value = { message, type }
}

const clearAlert = () => {
    alertMessage.value = null
}

// 組件掛載時載入訂單
onMounted(() => {
    console.log('MyOrders 組件已掛載')
    loadOrders()
})
</script>

<style scoped>
.my-orders-container {
    min-height: 100vh;
    background: var(--bg-50);
    padding-bottom: 80px;
}

/* 頂部標題區域 */
.header {
    background: white;
    padding: 16px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
}

.back-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.3s;
}

.back-btn:hover {
    background: var(--bg-100);
}

.back-icon {
    font-size: 20px;
    color: var(--text-100);
}

.title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-100);
    margin: 0;
}

.header-spacer {
    width: 32px;
}

/* 篩選區域 */
.filter-section {
    background: white;
    padding: 16px 20px;
    border-bottom: 1px solid var(--bg-200);
}

.status-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
}

.status-tab {
    background: var(--bg-100);
    border: 1px solid var(--bg-200);
    color: var(--text-200);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
    flex-shrink: 0;
}

.status-tab.active {
    background: var(--primary-100);
    color: white;
    border-color: var(--primary-100);
}

.status-tab:hover:not(.active) {
    background: var(--bg-200);
}

/* 訂單區域 */
.orders-section {
    padding: 16px 20px;
}

.no-orders {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.no-orders h3 {
    color: var(--text-100);
    margin: 16px 0 8px;
    font-size: 18px;
}

.no-orders p {
    color: var(--text-200);
    margin: 8px 0 24px;
    line-height: 1.5;
}

.order-btn {
    background: var(--primary-100);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.order-btn:hover {
    background: var(--primary-200);
}

.btn-icon {
    font-size: 18px;
}

/* 訂單列表 */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.order-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--bg-200);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.order-info {
    flex: 1;
}

.order-id {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-100);
    margin: 0 0 4px 0;
}

.order-date {
    font-size: 14px;
    color: var(--text-200);
    margin: 0 0 2px 0;
}

.order-time {
    font-size: 12px;
    color: var(--text-300);
    margin: 0;
}

.order-status {
    flex-shrink: 0;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-pending {
    background: #fff3cd;
    color: #856404;
}

.status-confirmed {
    background: #d1ecf1;
    color: #0c5460;
}

.status-preparing {
    background: #ffeaa7;
    color: #b8860b;
}

.status-ready {
    background: #d4edda;
    color: #155724;
}

.status-delivered {
    background: #d4edda;
    color: #155724;
}

.status-cancelled {
    background: #f8d7da;
    color: #721c24;
}

/* 訂單商品列表 */
.order-items {
    border: 1px solid var(--bg-200);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--bg-50);
}

.order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}

.order-item:not(:last-child) {
    border-bottom: 1px solid var(--bg-200);
}

.item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.item-name {
    font-weight: 500;
    color: var(--text-100);
}

.item-quantity {
    font-size: 14px;
    color: var(--text-200);
}

.quantity-warning {
    font-size: 12px;
    color: #dc3545;
    font-weight: 500;
}

.item-price {
    font-weight: 600;
    color: var(--text-100);
}

/* 訂單底部 */
.order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--bg-200);
}

.order-total {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-100);
}

.total-label {
    color: var(--text-200);
}

.total-amount {
    color: var(--primary-100);
}

.order-actions {
    display: flex;
    gap: 8px;
}

.detail-btn,
.cancel-btn,
.reorder-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid;
}

.detail-btn {
    background: var(--bg-100);
    color: var(--text-100);
    border-color: var(--bg-200);
}

.detail-btn:hover {
    background: var(--bg-200);
}

.cancel-btn {
    background: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
}

.cancel-btn:hover {
    background: #f1b0b7;
}

.reorder-btn {
    background: var(--primary-100);
    color: white;
    border-color: var(--primary-100);
}

.reorder-btn:hover {
    background: var(--primary-200);
}

/* 彈窗樣式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
    padding: 20px 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--bg-200);
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-100);
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-200);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.close-btn:hover {
    background: var(--bg-100);
}

.modal-body {
    padding: 0 20px 20px;
}

.modal-footer {
    padding: 20px;
    border-top: 1px solid var(--bg-200);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

/* 訂單詳情樣式 */
.detail-section {
    margin-bottom: 24px;
}

.detail-section h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-100);
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--bg-200);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}

.detail-row:not(:last-child) {
    border-bottom: 1px solid var(--bg-100);
}

.detail-label {
    color: var(--text-200);
    font-weight: 500;
}

.detail-value {
    color: var(--text-100);
    font-weight: 500;
}

.status-text {
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
}

.total-row {
    font-size: 16px;
    font-weight: 600;
    padding-top: 12px;
    border-top: 2px solid var(--bg-200);
}

.total-row .detail-value {
    color: var(--primary-100);
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
}

.detail-item:not(:last-child) {
    border-bottom: 1px solid var(--bg-100);
}

.detail-item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-item-name {
    font-weight: 500;
    color: var(--text-100);
}

.detail-item-quantity {
    font-size: 14px;
    color: var(--text-200);
}

.detail-item-price {
    font-weight: 600;
    color: var(--text-100);
}

.detail-notes {
    background: var(--bg-50);
    padding: 12px;
    border-radius: 8px;
    color: var(--text-100);
    line-height: 1.5;
    margin: 0;
}

/* 取消訂單確認彈窗 */
.confirm-modal {
    max-width: 400px;
}

.warning-text {
    color: #dc3545;
    font-size: 14px;
    margin: 8px 0 16px;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-100);
}

.cancel-reason-input {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    border: 1px solid var(--bg-200);
    border-radius: 8px;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
}

.cancel-reason-input:focus {
    outline: none;
    border-color: var(--primary-100);
}

.cancel-btn-secondary {
    background: var(--bg-100);
    color: var(--text-100);
    border: 1px solid var(--bg-200);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.cancel-btn-secondary:hover {
    background: var(--bg-200);
}

.confirm-btn {
    background: #dc3545;
    color: white;
    border: 1px solid #dc3545;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.confirm-btn:hover:not(:disabled) {
    background: #c82333;
}

.confirm-btn:disabled {
    background: var(--bg-300);
    color: var(--text-300);
    border-color: var(--bg-300);
    cursor: not-allowed;
}

/* 響應式設計 */
@media (max-width: 600px) {
    .order-footer {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .order-actions {
        justify-content: center;
    }

    .modal-overlay {
        padding: 10px;
    }

    .modal-content {
        max-height: 90vh;
    }

    .status-tabs {
        gap: 6px;
    }

    .status-tab {
        padding: 6px 12px;
        font-size: 13px;
    }
}
</style>
