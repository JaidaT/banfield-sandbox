import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Lets tests use the same "@/..." import paths as the app (from tsconfig.json).
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
  },
})
