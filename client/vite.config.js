import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,              // 클라이언트는 3000포트에서 실행
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // API 요청은 3001포트로 전달
        changeOrigin: true
      }
    }
  }
});