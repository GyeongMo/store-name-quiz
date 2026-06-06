import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // 편집기 저장이 quizzes.json에 기록될 때마다 HMR 풀 리로드로
      // 편집기가 닫히는 것을 방지 (런타임은 localStorage 오버레이로 라이브 반영)
      ignored: ['**/src/data/quizzes.json'],
    },
  },
})
