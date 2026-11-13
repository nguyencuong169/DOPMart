import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'gsap', 'lucide-vue-next']
  }
})
