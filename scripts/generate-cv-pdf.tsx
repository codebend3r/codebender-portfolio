// Build step: renders the resume PDF once so the Angular page can serve it as
// a static asset. Run with Bun (`bun run generate:cv`), which resolves the
// tsconfig path aliases and TSX natively. React runs here at build time only —
// the `/angular-version` route itself stays React-free.
import { Font, renderToBuffer } from "@react-pdf/renderer"
import { tokens } from "@theme/tokens"
import { mkdir } from "node:fs/promises"
import path from "node:path"

import { resumeData } from "@data/resumeData"

import { ResumePDF } from "@pdf/ResumePDF"

import { documentFileName } from "@utils/documentFileName"
import { normalizeData } from "@utils/normalizeData"

// `@pdf/fonts` resolves the font files with Vite-only `?url` imports, so this
// script registers the same faces from their `node_modules` paths instead.
const fontFile = ({ pkg, name }: { pkg: string; name: string }) =>
  path.join(
    path.dirname(Bun.resolveSync(`${pkg}/package.json`, import.meta.dir)),
    "files",
    `${pkg.replace("@fontsource/", "")}-latin-${name}.woff`
  )

const serifFile = (name: string) =>
  fontFile({ pkg: "@fontsource/source-serif-4", name })
const sansFile = (name: string) =>
  fontFile({ pkg: "@fontsource/source-sans-3", name })

Font.register({
  family: tokens.font.family,
  fonts: [
    { src: serifFile("400-normal"), fontWeight: 400, fontStyle: "normal" },
    { src: serifFile("400-italic"), fontWeight: 400, fontStyle: "italic" },
    { src: serifFile("600-normal"), fontWeight: 600, fontStyle: "normal" },
    { src: serifFile("600-italic"), fontWeight: 600, fontStyle: "italic" },
    { src: serifFile("700-normal"), fontWeight: 700, fontStyle: "normal" },
  ],
})
Font.register({
  family: tokens.font.sans,
  fonts: [
    { src: sansFile("400-normal"), fontWeight: 400, fontStyle: "normal" },
    { src: sansFile("400-italic"), fontWeight: 400, fontStyle: "italic" },
    { src: sansFile("600-normal"), fontWeight: 600, fontStyle: "normal" },
    { src: sansFile("700-normal"), fontWeight: 700, fontStyle: "normal" },
  ],
})
Font.registerHyphenationCallback((word) => [word])

const data = normalizeData(structuredClone(resumeData))
const buffer = await renderToBuffer(<ResumePDF data={data} />)

const outDir = path.resolve(import.meta.dir, "../public/cv")
await mkdir(outDir, { recursive: true })

const fileName = documentFileName({
  name: data.name,
  label: data.title,
  extension: "pdf",
})
await Bun.write(path.join(outDir, fileName), buffer)

console.log(`wrote public/cv/${fileName} (${buffer.length} bytes)`)
