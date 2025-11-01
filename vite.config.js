import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'abranchiate-angelique-unforeign.ngrok-free.dev'
    ],
    hmr: {
      protocol: 'wss',
      host: 'abranchiate-angelique-unforeign.ngrok-free.dev',
      clientPort: 443
    }
  }
})
