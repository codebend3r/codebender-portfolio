import angular from "@analogjs/vite-plugin-angular"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    angular({
      tsconfig: path.resolve(import.meta.dirname, "tsconfig.angular.json"),
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@App": path.resolve(import.meta.dirname, "src/App.tsx"),
      "@app": path.resolve(import.meta.dirname, "src"),
      "@ngapp": path.resolve(import.meta.dirname, "src/angular"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
      "@components": path.resolve(import.meta.dirname, "src/components"),
      "@data": path.resolve(import.meta.dirname, "src/data"),
      "@docx": path.resolve(import.meta.dirname, "src/docx"),
      "@edit": path.resolve(import.meta.dirname, "src/edit"),
      "@generate": path.resolve(import.meta.dirname, "src/generate"),
      "@pdf": path.resolve(import.meta.dirname, "src/pdf"),
      "@sky": path.resolve(import.meta.dirname, "src/sky.ts"),
      "@state": path.resolve(import.meta.dirname, "src/state"),
      "@styles": path.resolve(import.meta.dirname, "src/styles"),
      "@theme": path.resolve(import.meta.dirname, "src/theme"),
      "@utils": path.resolve(import.meta.dirname, "src/utils"),
      "@weather": path.resolve(import.meta.dirname, "src/weather.ts"),
    },
  },
  test: {
    globals: false,
    environment: "jsdom",
    // Blanks the runtime env so nothing reads a real project by accident.
    // This does NOT reach `import.meta.env.VITE_*` in src — Vite inlines
    // those from `.env` at transform time, so a machine with a `.env` still
    // gets cloudConfigured === true. Any suite whose behaviour depends on
    // cloudConfigured must mock @state/supabase explicitly, or it passes
    // locally and fails on CI.
    env: {
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
    },
    // On CI's low-core runners, Vitest's CPU-based default collapses to a
    // single worker, which serializes all 80 files into one process and lets
    // module-level state (the Zustand store, Angular's TestBed/vi.mock
    // singletons) bleed across files. Pin a floor above 1 so files always
    // get separate, isolated processes.
    maxWorkers: 4,
    setupFiles: ["./src/test/setup.ts", "./src/angular/test-setup.ts"],
    css: false,
    reporters: ["dot"],
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
