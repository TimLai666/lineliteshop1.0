<script setup>
import HelloWorld from './components/HelloWorld.vue'
import { liff } from '@line/liff'

liff.init({
  liffId: '1657778888-xxxxxx' // 替換為你的 LIFF ID
}).then(() => {
  console.log('LIFF initialized successfully')
}).catch((error) => {
  console.error('LIFF initialization failed:', error)
})
</script>

<template>
  <h1>{{ liff.getOS() }}</h1>
  <h2>{{ liff.getFriendship() }}</h2>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
