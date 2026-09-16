import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: Number(process.env.PORT) || 5275, strictPort: false },
  build: { target: 'esnext' },
})
