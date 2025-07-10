<template>
    <div v-if="visible" class="message-alert" :class="type">
        <div class="message-content">
            <span class="message-icon">{{ getIcon() }}</span>
            <span class="message-text">{{ message }}</span>
        </div>
    </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

defineProps({
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'info',
        validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    visible: {
        type: Boolean,
        default: true
    }
})

const getIcon = () => {
    const props = getCurrentInstance().props
    switch (props.type) {
        case 'success': return '✅'
        case 'error': return '❌'
        case 'warning': return '⚠️'
        default: return 'ℹ️'
    }
}
</script>

<style scoped>
.message-alert {
    margin-top: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    text-align: center;
    font-weight: 500;
    border: 1px solid;
}

.message-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.message-icon {
    font-size: 18px;
}

.message-text {
    flex: 1;
}

.message-alert.success {
    background: var(--primary-300);
    color: var(--text-100);
    border-color: var(--primary-100);
}

.message-alert.error {
    background: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
}

.message-alert.warning {
    background: var(--primary-300);
    color: var(--text-100);
    border-color: var(--primary-200);
}

.message-alert.info {
    background: var(--bg-100);
    color: var(--text-100);
    border-color: var(--accent-100);
}
</style>
