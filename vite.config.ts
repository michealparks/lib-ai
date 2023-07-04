import { defineConfig } from 'vite'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5175,
    strictPort: true,
    fs: {
      strict: true,
      allow: ['.'],
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  envPrefix: ['THREE', 'SWORD'],
  resolve:{
    alias:{
      'sword/debug': path.resolve(__dirname, './playground/sword/debug/index'),
      'sword' : path.resolve(__dirname, './playground/sword/main'),
    },
  },
})
