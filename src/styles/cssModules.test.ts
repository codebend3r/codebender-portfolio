import { readFileSync, readdirSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// CSS Modules hashes every keyframe name in a `.module.css` file, so an
// animation can only resolve a @keyframes declared in that same file. A name
// borrowed from a global stylesheet compiles to a hash nothing defines, and
// the animation silently never runs — which is how the rain and snow layers
// sat frozen above the viewport.

const srcRoot = resolve(import.meta.dirname, "..")

const moduleFiles = readdirSync(srcRoot, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".module.css"))
  .map((file) => join(srcRoot, file))

const ANIMATION_KEYWORDS = new Set([
  "alternate",
  "alternate-reverse",
  "backwards",
  "both",
  "ease",
  "ease-in",
  "ease-in-out",
  "ease-out",
  "forwards",
  "infinite",
  "linear",
  "none",
  "normal",
  "paused",
  "reverse",
  "running",
  "step-end",
  "step-start",
])

const definedKeyframes = (css: string): Set<string> =>
  new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(([, name]) => name))

// Drops function calls (`steps(1)`, `cubic-bezier(…)`, `var(…)`), then keeps
// the identifiers that aren't timing, direction, fill, or play-state keywords.
const referencedKeyframes = (css: string): string[] =>
  [...css.matchAll(/\banimation(?:-name)?\s*:\s*([^;}]+)/g)].flatMap(
    ([, value]) =>
      value
        .replace(/[\w-]+\([^)]*\)/g, " ")
        .split(/[\s,]+/)
        .filter((token) => /^-?[a-z_][\w-]*$/i.test(token))
        .filter((token) => !ANIMATION_KEYWORDS.has(token))
  )

describe("CSS Module keyframes", () => {
  it("finds the module stylesheets to check", () => {
    expect(moduleFiles.length).toBeGreaterThan(0)
  })

  it.each(moduleFiles.map((file) => [relative(srcRoot, file), file]))(
    "%s declares every keyframe it animates",
    (_, file) => {
      const css = readFileSync(file, "utf8")
      const defined = definedKeyframes(css)
      const missing = referencedKeyframes(css).filter(
        (name) => !defined.has(name)
      )
      expect(missing).toEqual([])
    }
  )

  it("parses names out of animation shorthand", () => {
    expect(
      referencedKeyframes(
        ".a { animation: chatCaretBlink 1s steps(1) infinite; }\n" +
          ".b { animation-name: snowFall; }\n" +
          ".c { animation: none; }"
      )
    ).toEqual(["chatCaretBlink", "snowFall"])
  })
})
