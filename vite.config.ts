import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"

function manualChunks(id) {
  if (id.includes("node_modules")) {
    if (id.includes("react")) {
      return "react"
    } else if (id.includes("react-dom")) {
      return "react-dom"
    } else if (id.includes("core-js")) {
      return "core-js"
    } else if (id.includes("zustand")) {
      return "zustand"
    } else if (
      id.includes("html2pdf") ||
      id.includes("html2canvas") ||
      id.includes("jspdf")
    ) {
      return "html2pdf"
    } else {
      return "vendor"
    }
  }

  return null
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4242,
  },
  resolve: {
    alias: {
      "@App": path.resolve(__dirname, "src/App.tsx"),
      "@app": path.resolve(__dirname, "src/App.tsx"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@data": path.resolve(__dirname, "src/data"),
      "@sky": path.resolve(__dirname, "src/sky.ts"),
      "@state": path.resolve(__dirname, "src/state"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@weather": path.resolve(__dirname, "src/weather.ts"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
