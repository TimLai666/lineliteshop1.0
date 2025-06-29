import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/liff/',  // 設定基礎路徑為 /liff/
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
