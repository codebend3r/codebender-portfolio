import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { resumeData } from "@data/resumeData"

// The same resume data renders through four independent pipelines. Only the
// screen one is visible while editing — the other three drop an unreferenced
// key silently, with every test still green and the build still clean.
//
// This suite closes that gap: every top-level key in `resume.json` must be
// referenced by every target, or be registered in OMISSIONS with a reason.
// See the `resume-section` skill.

const repoRoot = resolve(import.meta.dirname, "../..")

const sourcesIn = (dir: string, suffix: string): string[] =>
  readdirSync(join(repoRoot, dir))
    .filter((file) => file.endsWith(suffix) && !file.includes(".test."))
    .map((file) => readFileSync(join(repoRoot, dir, file), "utf8"))

const fileAt = (path: string): string[] => [
  readFileSync(join(repoRoot, path), "utf8"),
]

type Target = {
  name: string
  sources: () => string[]
}

const TARGETS: Target[] = [
  { name: "react", sources: () => sourcesIn("src/components", ".tsx") },
  { name: "pdf", sources: () => fileAt("src/pdf/ResumePDF.tsx") },
  { name: "docx", sources: () => fileAt("src/docx/ResumeDocx.ts") },
  {
    name: "angular",
    sources: () => sourcesIn("src/angular/components", ".ts"),
  },
]

// A key listed here is deliberately absent from that target. Add an entry only
// when the field genuinely has no meaning in the target — never to silence a
// failure. Loosening the matcher instead is not an option.
const OMISSIONS: Record<string, Partial<Record<string, string>>> = {
  skill_descriptions: {
    pdf: "hover tooltip copy; a static page has nowhere to surface it",
    docx: "hover tooltip copy; a Word document has nowhere to surface it",
  },
  showcase: {
    pdf: "screen-only today — image-led section, no print layout designed yet",
    docx: "screen-only today — image-led section, no Word layout designed yet",
  },
}

const referencedIn = (sources: string[], key: string): boolean =>
  sources.some((source) => new RegExp(`\\b${key}\\b`).test(source))

describe("resume data coverage", () => {
  const keys = Object.keys(resumeData)

  it("has top-level keys to check", () => {
    expect(keys.length).toBeGreaterThan(0)
  })

  TARGETS.forEach((target) => {
    describe(target.name, () => {
      keys.forEach((key) => {
        const omissionReason = OMISSIONS[key]?.[target.name]

        it(`${omissionReason ? "deliberately omits" : "renders"} ${key}`, () => {
          expect(referencedIn(target.sources(), key)).toBe(!omissionReason)
        })
      })
    })
  })

  it("registers no omission for a key that no longer exists", () => {
    expect(Object.keys(OMISSIONS).filter((key) => !keys.includes(key))).toEqual(
      []
    )
  })

  it("registers no omission against an unknown target", () => {
    const names = TARGETS.map((target) => target.name)
    const unknown = Object.values(OMISSIONS).flatMap((byTarget) =>
      Object.keys(byTarget).filter((name) => !names.includes(name))
    )
    expect(unknown).toEqual([])
  })
})
