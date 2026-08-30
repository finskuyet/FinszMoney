import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'dashboard.html'),
        login: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'register.html')
      }
    }
  }
})
