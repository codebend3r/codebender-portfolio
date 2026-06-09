import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@App": path.resolve(__dirname, "src/App.tsx"),
      "@app": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@data": path.resolve(__dirname, "src/data"),
      "@pdf": path.resolve(__dirname, "src/pdf"),
      "@sky": path.resolve(__dirname, "src/sky.ts"),
      "@state": path.resolve(__dirname, "src/state"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@weather": path.resolve(__dirname, "src/weather.ts"),
    },
  },
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/Entry.tsx",
        "src/vite-env.d.ts",
      ],
    },
  },
})
