import path from 'node:path';

import svgr from '@svgr/rollup'; // added
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), svgr() /* enables importing SVGs as React components */],
  assetsInclude: ['**/*.png', '**/*.svg'], // explicit (optional; Vite handles by default)
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
});
