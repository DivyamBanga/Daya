import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Daya/',
  plugins: [react()],
  build: {
    target: 'es2018',
  },
})
