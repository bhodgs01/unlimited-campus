import { defineConfig } from 'vite'

export default defineConfig({
  // The campus lives under /campus/ on the host it shares with the 2D dashboard. Every runtime
  // asset path is built from import.meta.env.BASE_URL, so this one setting moves the whole app.
  base: '/campus/',
  server: { port: Number(process.env.PORT) || 5275, strictPort: false },
  build: {
    target: 'esnext',
    rollupOptions: {
      // bubble.js: the Ask + Log-a-ticket bubble on its own, at a stable name, so the server can
      // add it to the 2D dashboard's pages as well.
      input: { main: 'index.html', bubble: 'src/bubble-standalone.js' },
      output: { entryFileNames: (chunk) => (chunk.name === 'bubble' ? 'bubble.js' : 'assets/[name]-[hash].js') },
    },
  },
})
