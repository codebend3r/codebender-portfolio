import { version as reactVersion } from "react"

import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"
import type { Plugin, Rolldown } from "vite"

// The package that owns a module, by its outermost `node_modules` entry, so a
// copy nested under another package (`@react-pdf/reconciler` ships its own
// `scheduler`) stays with that package.
function packageOf(id: string) {
  const [, name = ""] =
    /node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/.exec(id) ?? []
  return name.replace(/\\/g, "/")
}

function chunkGroup({ name, packages }: { name: string; packages: string[] }) {
  return {
    name,
    test: (id: string) => {
      const owner = packageOf(id)
      return packages.some((p) => owner === p || owner.startsWith(`${p}/`))
    },
  }
}

// Order matters: an earlier group claims a module first, and each group also
// pulls in its dependencies. React and `buffer` come before the lazy groups
// that import them; otherwise React lands inside `dnd-kit` (so the entry
// downloads dnd-kit on every page) and a PDF export downloads all of `docx`
// just to get `buffer`.
const chunkGroups: Rolldown.CodeSplittingGroup[] = [
  chunkGroup({ name: "react", packages: ["react"] }),
  chunkGroup({ name: "react-dom", packages: ["react-dom", "scheduler"] }),
  chunkGroup({ name: "zustand", packages: ["zustand"] }),
  // Shared by the PDF and Word exports, so neither pulls in the other.
  chunkGroup({ name: "buffer", packages: ["buffer", "base64-js", "ieee754"] }),
  chunkGroup({
    name: "react-pdf",
    packages: ["@react-pdf", "fontkit", "@fontsource"],
  }),
  // Only reachable through the lazy-loaded Word export on the edit page.
  chunkGroup({ name: "docx", packages: ["docx", "fflate"] }),
  // Only reachable through the lazy-loaded `SortableListImpl` on the edit page.
  chunkGroup({ name: "dnd-kit", packages: ["@dnd-kit"] }),
  chunkGroup({ name: "core-js", packages: ["core-js"] }),
  chunkGroup({ name: "supabase", packages: ["@supabase"] }),
  { name: "vendor", test: /node_modules[\\/]/ },
]

// `@react-pdf/reconciler` bundles three reconciler builds (React <= 18,
// 19.0-19.1, >= 19.2) and picks one at runtime from `React.version`, so all
// three ship. Resolve straight to the build this React version uses.
function reactPdfReconciler(): Plugin {
  const [major = 0, minor = 0] = reactVersion.split(".").map(Number)
  const supportsReact19_2 = major > 19 || (major === 19 && minor >= 2)

  return {
    name: "react-pdf-reconciler",
    apply: "build",
    enforce: "pre",
    resolveId(source, importer) {
      if (source !== "@react-pdf/reconciler" || !supportsReact19_2) {
        return null
      }

      return this.resolve(
        "@react-pdf/reconciler/lib/reconciler-33.js",
        importer,
        { skipSelf: true }
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), reactPdfReconciler()],
  server: {
    port: 4242,
  },
  resolve: {
    alias: {
      "@App": path.resolve(import.meta.dirname, "src/App.tsx"),
      "@app": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
      "@chat": path.resolve(import.meta.dirname, "src/chat"),
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
  build: {
    chunkSizeWarningLimit: 2000,
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !d.includes("react-pdf") && !d.includes("dnd-kit")),
    },
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: chunkGroups,
        },
      },
    },
  },
})
