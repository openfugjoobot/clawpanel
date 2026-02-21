import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync('/home/ubuntu/.openclaw/certs/clawpanel.key'),
      cert: fs.readFileSync('/home/ubuntu/.openclaw/certs/clawpanel.crt')
    },
    allowedHosts: ['clawpanel.fugjoo.duckdns.org', '*.fugjoo.duckdns.org'],
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      }
    }
  }
})

