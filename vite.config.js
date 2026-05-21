import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Ini akan memunculkan alamat IP di terminal
    port: 5173
  }
})