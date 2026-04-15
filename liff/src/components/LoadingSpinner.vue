<template>
    <div class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">{{ message }}</p>
    </div>
</template>

<script setup>
defineProps({
    message: {
        type: String,
        default: '載入中...'
    }
})
</script>

<style scoped>
.loading-container {
    text-align: center;
    padding: 44px 24px;
    color: var(--text-200);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 248, 241, 0.9));
    border: 1px solid var(--border-soft);
    border-radius: 28px;
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(14px);
}

.spinner {
    width: 46px;
    height: 46px;
    border: 4px solid rgba(var(--primary-rgb), 0.12);
    border-top: 4px solid var(--primary-100);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 18px;
    box-shadow: 0 0 0 8px rgba(var(--primary-rgb), 0.05);
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-text {
    margin: 0;
    font-size: 16px;
    letter-spacing: 0.02em;
}
</style>
