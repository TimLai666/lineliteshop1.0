<script setup>
// 移除直接導入 UserRegister，改用路由管理
</script>

<template>
  <router-view />
</template>

<style>
/* 確保 App 組件完全沒有 padding 和 margin */
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
