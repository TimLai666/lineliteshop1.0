<template>
    <div class="user-profile-card">
        <div class="avatar">
            <img :src="profile.pictureUrl" :alt="profile.displayName" />
        </div>

        <div class="user-info">
            <h3>歡迎，{{ profile.displayName }}！</h3>
            <p class="uid">用戶 ID: {{ profile.userId }}</p>
            <p class="status">狀態訊息: {{ profile.statusMessage || '無' }}</p>
        </div>
    </div>
</template>

<script setup>
// 接收父組件傳入的用戶資料
defineProps({
    profile: {
        type: Object,
        required: true
    }
})
</script>

<style scoped>
.user-profile-card {
    text-align: center;
    margin-bottom: 24px;
    padding: 24px 20px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 249, 242, 0.88));
    border: 1px solid var(--border-soft);
    border-radius: 28px;
    box-shadow: var(--shadow-soft);
    backdrop-filter: blur(14px);
}

.avatar {
    margin-bottom: 16px;
}

.avatar img {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.92);
    object-fit: cover;
    box-shadow:
        0 0 0 1px rgba(var(--primary-rgb), 0.18),
        0 16px 30px rgba(var(--primary-rgb), 0.18);
}

.user-info h3 {
    color: var(--text-100);
    margin: 16px 0 8px;
    font-size: 22px;
}

.uid {
    font-family: monospace;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px 12px;
    border-radius: 14px;
    font-size: 12px;
    color: var(--text-200);
    margin: 8px 0;
    word-break: break-all;
    border: 1px solid rgba(var(--primary-rgb), 0.1);
}

.status {
    color: var(--text-200);
    font-size: 14px;
    margin-bottom: 0;
    line-height: 1.6;
}

@media (max-width: 600px) {
    .avatar img {
        width: 72px;
        height: 72px;
    }
}
</style>
