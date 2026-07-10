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
  test: {
    globals: false,
    environment: "jsdom",
    // Force cloud sync off in tests regardless of a local .env; suites that
    // exercise cloud UI mock @state/supabase explicitly.
    env: {
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
    },
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    reporters: ["tree"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "netlify/functions/**/*.test.ts",
    ],
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
