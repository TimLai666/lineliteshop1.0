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
    padding: 40px 20px;
    color: var(--text-200);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--bg-200);
    border-top: 4px solid var(--primary-100);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
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
}
</style>
