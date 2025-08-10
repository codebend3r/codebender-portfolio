import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from '@svgr/rollup' // added

export default defineConfig({
  plugins: [
    react(),
    svgr() // enables importing SVGs as React components
  ],
  assetsInclude: ['**/*.png', '**/*.svg'] // explicit (optional; Vite handles by default)
})
