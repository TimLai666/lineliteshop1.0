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
    padding: 14px 18px;
    border-radius: 20px;
    text-align: left;
    font-weight: 500;
    border: 1px solid;
    backdrop-filter: blur(14px);
    box-shadow: var(--shadow-soft);
}

.message-content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}

.message-icon {
    font-size: 18px;
}

.message-text {
    flex: 1;
    line-height: 1.5;
}

.message-alert.success {
    background: linear-gradient(135deg, rgba(255, 243, 176, 0.82), rgba(255, 255, 255, 0.92));
    color: var(--text-100);
    border-color: rgba(var(--primary-rgb), 0.2);
}

.message-alert.error {
    background: linear-gradient(135deg, rgba(248, 215, 218, 0.92), rgba(255, 245, 246, 0.96));
    color: #721c24;
    border-color: rgba(220, 53, 69, 0.24);
}

.message-alert.warning {
    background: linear-gradient(135deg, rgba(255, 243, 176, 0.88), rgba(255, 250, 236, 0.96));
    color: var(--text-100);
    border-color: rgba(var(--primary-rgb), 0.18);
}

.message-alert.info {
    background: linear-gradient(135deg, rgba(161, 226, 255, 0.22), rgba(255, 255, 255, 0.92));
    color: var(--text-100);
    border-color: rgba(var(--accent-rgb), 0.18);
}
</style>
