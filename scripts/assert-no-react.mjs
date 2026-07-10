// Post-build guardrail: fails the build if any React (or zustand) code is
// reachable from the Angular entry at dist/angular-version/index.html.
// "Remove React completely for that route" is enforced here, not by hope.
import { readFile } from "node:fs/promises"
import path from "node:path"

const distDir = path.resolve(import.meta.dirname, "../dist")
const entryHtmlPath = path.join(distDir, "angular-version/index.html")

const FORBIDDEN_CHUNK_NAME = /(^|[/-])(react|react-dom|zustand)-/i
const FORBIDDEN_CONTENT = [
  "react.production",
  "react-dom.production",
  "react_jsx",
  "zustand",
]

const html = await readFile(entryHtmlPath, "utf8")

const assetUrls = [
  ...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g),
].map((match) => match[1])

if (assetUrls.length === 0) {
  console.error(
    `assert-no-react: no JS assets referenced by ${entryHtmlPath} — ` +
      "the Angular entry emitted nothing"
  )
  process.exit(1)
}

const visited = new Set()
const queue = [...assetUrls]
const offenders = []

while (queue.length > 0) {
  const url = queue.pop()
  if (!url || visited.has(url)) continue
  visited.add(url)

  if (FORBIDDEN_CHUNK_NAME.test(url)) {
    offenders.push(`${url} (chunk name)`)
    continue
  }

  const filePath = path.join(distDir, url.replace(/^\//, ""))
  const code = await readFile(filePath, "utf8")

  const marker = FORBIDDEN_CONTENT.find((needle) => code.includes(needle))
  if (marker) offenders.push(`${url} (contains "${marker}")`)

  const staticImports = [
    ...code.matchAll(/(?:import|from)\s*"(\.\/[^"]+\.js)"/g),
  ].map((match) => match[1])
  const dynamicImports = [...code.matchAll(/import\("(\.\/[^"]+\.js)"\)/g)].map(
    (match) => match[1]
  )

  staticImports
    .concat(dynamicImports)
    .map((specifier) => `/assets/${specifier.replace(/^\.\//, "")}`)
    .filter((assetUrl) => !visited.has(assetUrl))
    .forEach((assetUrl) => queue.push(assetUrl))
}

if (offenders.length > 0) {
  console.error("assert-no-react: React reached the Angular entry graph:")
  offenders.forEach((offender) => console.error(`  - ${offender}`))
  process.exit(1)
}

console.log(
  `assert-no-react: OK — ${visited.size} chunks reachable from ` +
    "/angular-version are React-free"
)
