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
}

.avatar {
    margin-bottom: 16px;
}

.avatar img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid #00c851;
    object-fit: cover;
}

.user-info h3 {
    color: #333;
    margin: 16px 0 8px;
    font-size: 20px;
}

.uid {
    font-family: monospace;
    background: #f5f5f5;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #666;
    margin: 8px 0;
    word-break: break-all;
}

.status {
    color: #888;
    font-size: 14px;
    margin-bottom: 24px;
}

@media (max-width: 600px) {
    .avatar img {
        width: 60px;
        height: 60px;
    }
}
</style>
