import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"

function manualChunks(id: string) {
  if (id.includes("node_modules")) {
    if (
      id.includes("@react-pdf") ||
      id.includes("fontkit") ||
      id.includes("@fontsource")
    ) {
      return "react-pdf"
    } else if (
      id.includes("node_modules/docx/") ||
      id.includes("node_modules/buffer/") ||
      id.includes("node_modules/fflate/")
    ) {
      // Only reachable through the lazy-loaded Word export on the edit page.
      return "docx"
    } else if (id.includes("@dnd-kit")) {
      // Keep dnd-kit out of the eager `vendor` chunk; it is only reachable
      // through the lazy-loaded `SortableListImpl` on the edit page.
      return "dnd-kit"
    } else if (id.includes("react-dom")) {
      return "react-dom"
    } else if (id.includes("react")) {
      return "react"
    } else if (id.includes("core-js")) {
      return "core-js"
    } else if (id.includes("zustand")) {
      return "zustand"
    } else if (id.includes("@supabase")) {
      return "supabase"
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
      "@app": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@data": path.resolve(__dirname, "src/data"),
      "@docx": path.resolve(__dirname, "src/docx"),
      "@edit": path.resolve(__dirname, "src/edit"),
      "@generate": path.resolve(__dirname, "src/generate"),
      "@pdf": path.resolve(__dirname, "src/pdf"),
      "@sky": path.resolve(__dirname, "src/sky.ts"),
      "@state": path.resolve(__dirname, "src/state"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@theme": path.resolve(__dirname, "src/theme"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@weather": path.resolve(__dirname, "src/weather.ts"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !d.includes("react-pdf") && !d.includes("dnd-kit")),
    },
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
