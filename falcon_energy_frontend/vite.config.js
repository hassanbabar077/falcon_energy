import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No Tailwind - using vanilla CSS
export default defineConfig({
  plugins: [react()],
})
