import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Listens on all IP addresses (0.0.0.0) needed for tunnels
    allowedHosts: [
      'lodge-spot-regulations-yes.trycloudflare.com',
      '.trycloudflare.com' // Allows any future random cloudflare tunnel substrings 
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
  },
})
