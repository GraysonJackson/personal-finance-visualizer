import { defineConfig } from 'vite'

export default defineConfig({
  base: '/personal-finance-visualizer/',
  build: {
    outDir: 'out',
    emptyOutDir: true,
  },
})
