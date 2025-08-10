import path from 'path'
import { fileURLToPath } from 'url'

import svgr from '@svgr/rollup'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react(), svgr() /* enables importing SVGs as React components */],
  assetsInclude: ['**/*.png', '**/*.svg'],
  resolve: {
    alias: {
      '@App': path.resolve(__dirname, 'src/App.tsx'), // added proper case-sensitive alias to match imports
      '@app': path.resolve(__dirname, 'src/App.tsx'), // keep lowercase for safety if referenced elsewhere
      '@components': path.resolve(__dirname, 'src/components'),
      '@styles': path.resolve(__dirname, 'src/styles'),
    },
  },
})
