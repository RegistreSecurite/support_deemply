import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'docs', // indique que la racine de ton projet est /docs
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './docs'),
    },
  },
  publicDir: 'docs/public', // où sont les images et fichiers statiques
})