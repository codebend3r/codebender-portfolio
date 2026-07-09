# Word (.docx) Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generate Word" download to the `/generate` route that mirrors the PDF's theme, fully client-side.

**Architecture:** New `src/docx/` module mirroring `src/pdf/`, built on the `docx` library (`Packer.toBlob()` → existing `downloadBlob`). Theme tokens hoisted to `src/theme/` and shared by both renderers. Source Serif 4 Regular + Semibold TTFs are vendored and embedded into the .docx.

**Tech Stack:** React 19, Vite 8, Vitest 4 (jsdom), `docx@9.7.1`, `buffer@6.0.3`, `fflate@0.8.2` (dev, test-only). Spec: `docs/superpowers/specs/2026-07-09-word-export-design.md`.

## Global Constraints

- All scripts run through Bun (`bun install`, `bun run test`, …). Never npm/yarn.
- Every `package.json` dependency pinned exact — always `bun add --exact`.
- No `any`, no type casts (`as`), no `for/of`/`for/in` — use `map`/`filter`/`reduce`/`flatMap`.
- Prefer a single object parameter over positional parameters for new functions.
- Aliased imports only (`@docx/…`, `@theme/…`, `@utils/…`) — never relative.
- Tests co-located: `lib/foo.ts` ↔ `lib/foo.test.ts`.
- Commit subjects start with `CJR:`; bullet-point bodies; no Claude attribution.
- The husky pre-commit hook runs the full system-check (prettier:check, tsc, eslint, vitest, build) — run `bun run prettier` before every commit, and expect each commit to take ~1–2 min in the hook.
- All verified facts in this plan (docx API shapes, font name tables, `buffer` type compatibility, fflate assertions) were dry-run against `docx@9.7.1` — do not "fix" them speculatively.

---

### Task 1: `documentFileName` replaces `pdfFileName`

**Files:**

- Create: `src/utils/documentFileName.ts`
- Create: `src/utils/documentFileName.test.ts`
- Modify: `src/App.tsx:18,32`
- Modify: `src/edit/EditResumeApp.tsx:22,93`
- Delete: `src/utils/pdfFileName.ts`, `src/utils/pdfFileName.test.ts`

**Interfaces:**

- Produces: `documentFileName({ name, label, extension }: { name: string; label: string; extension: DocumentFormat }): string` and `type DocumentFormat = "pdf" | "docx"` — Tasks 5 and 6 import both from `@utils/documentFileName`.

- [ ] **Step 1: Write the failing test**

Create `src/utils/documentFileName.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { documentFileName } from "@utils/documentFileName"

describe("documentFileName", () => {
  it("joins name and label with a dash", () => {
    expect(
      documentFileName({
        name: "CJ Rivas",
        label: "Senior Frontend Engineer @ Achievers",
        extension: "pdf",
      })
    ).toBe("CJ Rivas - Senior Frontend Engineer @ Achievers.pdf")
  })

  it("appends the docx extension", () => {
    expect(
      documentFileName({ name: "CJ Rivas", label: "Base", extension: "docx" })
    ).toBe("CJ Rivas - Base.docx")
  })

  it("uses the name alone when the label is empty", () => {
    expect(
      documentFileName({ name: "CJ Rivas", label: "", extension: "pdf" })
    ).toBe("CJ Rivas.pdf")
  })

  it("replaces filesystem-illegal characters", () => {
    expect(
      documentFileName({
        name: "CJ Rivas",
        label: 'UI/UX Lead: "Web" <Core>',
        extension: "pdf",
      })
    ).toBe("CJ Rivas - UI-UX Lead- -Web- -Core-.pdf")
  })

  it("collapses surrounding whitespace", () => {
    expect(
      documentFileName({
        name: " CJ Rivas ",
        label: " Frontend @ Acme ",
        extension: "pdf",
      })
    ).toBe("CJ Rivas - Frontend @ Acme.pdf")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/utils/documentFileName.test.ts`
Expected: FAIL — cannot resolve `@utils/documentFileName`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/documentFileName.ts`:

```ts
const ILLEGAL_CHARS = /[/\\:*?"<>|]/g

export type DocumentFormat = "pdf" | "docx"

export function documentFileName({
  name,
  label,
  extension,
}: {
  name: string
  label: string
  extension: DocumentFormat
}): string {
  const base = [name.trim(), label.trim()].filter(Boolean).join(" - ")
  return `${base.replace(ILLEGAL_CHARS, "-")}.${extension}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/utils/documentFileName.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Switch call sites and delete `pdfFileName`**

In `src/App.tsx` replace the import (line 18):

```ts
import { documentFileName } from "@utils/documentFileName"
```

and the call (line 32):

```ts
downloadBlob(
  blob,
  documentFileName({ name: data.name, label: data.title, extension: "pdf" })
)
```

In `src/edit/EditResumeApp.tsx` replace the import (line 22):

```ts
import { documentFileName } from "@utils/documentFileName"
```

and inside `onGenerate` (line 93):

```ts
downloadBlob(
  blob,
  documentFileName({
    name: data.name,
    label: activeName || data.title,
    extension: "pdf",
  })
)
```

Then delete the old files:

```bash
git rm src/utils/pdfFileName.ts src/utils/pdfFileName.test.ts
```

- [ ] **Step 6: Run the full test suite**

Run: `bun run test`
Expected: PASS — `App.test.tsx` still asserts the exact filename `"CJ Rivas - Senior Frontend Engineer + Architect.pdf"`, which is unchanged behavior.

- [ ] **Step 7: Commit**

```bash
bun run prettier
git add -A
git commit -m "CJR: replace pdfFileName with format-aware documentFileName

- object parameter with pdf/docx extension
- updates App and EditResumeApp call sites"
```

---

### Task 2: Hoist theme tokens to `@theme`

**Files:**

- Move: `src/pdf/tokens.ts` → `src/theme/tokens.ts`
- Modify: `tsconfig.json:15-30` (paths), `vite.config.ts:40-55` (alias), `vitest.config.ts:7-23` (alias)
- Modify: `src/pdf/styles.ts:3`, `src/pdf/fonts.ts:8`

**Interfaces:**

- Produces: `tokens` importable from `@theme/tokens` (same shape as today: `colors`, `fontSize`, `spacing`, `page`, `font`). Tasks 3–4 depend on this.

- [ ] **Step 1: Move the file and add aliases**

```bash
mkdir -p src/theme
git mv src/pdf/tokens.ts src/theme/tokens.ts
```

In `tsconfig.json` `compilerOptions.paths`, add (alphabetical, after `"@styles/*"`):

```json
"@theme/*": ["./src/theme/*"],
```

In `vite.config.ts` `resolve.alias`, add (after `"@styles"`):

```ts
"@theme": path.resolve(__dirname, "src/theme"),
```

In `vitest.config.ts` `resolve.alias`, add the same line:

```ts
"@theme": path.resolve(__dirname, "src/theme"),
```

- [ ] **Step 2: Update the two importers**

In `src/pdf/styles.ts` and `src/pdf/fonts.ts` replace:

```ts
import { tokens } from "@pdf/tokens"
```

with:

```ts
import { tokens } from "@theme/tokens"
```

- [ ] **Step 3: Verify**

Run: `bun run ts:check && bun run test`
Expected: both PASS; `grep -rn "@pdf/tokens" src` returns nothing.

- [ ] **Step 4: Commit**

```bash
bun run prettier
git add -A
git commit -m "CJR: hoist theme tokens to src/theme with @theme alias

- shared by the PDF renderer and the upcoming Word renderer"
```

---

### Task 3: Dependencies, vendored fonts, and the font loader

**Files:**

- Modify: `package.json` (deps), `tsconfig.json` (paths), `vite.config.ts` (alias + manualChunks), `vitest.config.ts` (alias)
- Create: `src/docx/fonts/SourceSerif4-Regular.ttf`, `src/docx/fonts/SourceSerif4-Semibold.ttf`, `src/docx/fonts/LICENSE.md` (vendored, OFL)
- Create: `src/docx/fonts.ts`

**Interfaces:**

- Produces: `loadDocxFonts(): Promise<DocxFont[]>` and `type DocxFont = { name: string; data: Buffer }` from `@docx/fonts`. Font-table names are exactly `"Source Serif 4"` (Regular) and `"Source Serif 4 Semibold"` (Semibold) — these match the TTFs' internal legacy family names (verified from the 4.005R name tables) and Task 4 references them.

- [ ] **Step 1: Add dependencies (exact pins)**

```bash
bun add --exact docx@9.7.1 buffer@6.0.3
bun add --exact --dev fflate@0.8.2
```

Verify `package.json` shows `"docx": "9.7.1"`, `"buffer": "6.0.3"`, `"fflate": "0.8.2"` with no `^`/`~`.

- [ ] **Step 2: Add `@docx` aliases**

`tsconfig.json` paths (after `"@data/*"`):

```json
"@docx": ["./src/docx"],
"@docx/*": ["./src/docx/*"],
```

`vite.config.ts` and `vitest.config.ts` alias (after `"@data"`):

```ts
"@docx": path.resolve(__dirname, "src/docx"),
```

- [ ] **Step 3: Vendor the TTFs**

```bash
mkdir -p src/docx/fonts
curl -sL -o /tmp/source-serif-4.005.zip https://github.com/adobe-fonts/source-serif/releases/download/4.005R/source-serif-4.005_Desktop.zip
unzip -o -j /tmp/source-serif-4.005.zip \
  "source-serif-4.005_Desktop/TTF/SourceSerif4-Regular.ttf" \
  "source-serif-4.005_Desktop/TTF/SourceSerif4-Semibold.ttf" \
  "source-serif-4.005_Desktop/LICENSE.md" \
  -d src/docx/fonts
rm /tmp/source-serif-4.005.zip
```

Expected: `ls -la src/docx/fonts` shows the two TTFs (~253KB and ~272KB) plus `LICENSE.md`.

- [ ] **Step 4: Write the font loader**

Create `src/docx/fonts.ts`:

```ts
import serifRegular from "@docx/fonts/SourceSerif4-Regular.ttf?url"
import serifSemibold from "@docx/fonts/SourceSerif4-Semibold.ttf?url"
import { tokens } from "@theme/tokens"
import { Buffer } from "buffer"

export type DocxFont = { name: string; data: Buffer }

async function loadFont({
  name,
  url,
}: {
  name: string
  url: string
}): Promise<DocxFont> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load font "${name}" (${response.status})`)
  }
  return { name, data: Buffer.from(await response.arrayBuffer()) }
}

// Word embeds one face per font-table family name. Regular carries the
// style-linked bold/italic runs; Semibold is its own legacy family (used by
// company lines). Names must match the TTFs' internal family names.
export function loadDocxFonts(): Promise<DocxFont[]> {
  return Promise.all([
    loadFont({ name: tokens.font.family, url: serifRegular }),
    loadFont({ name: `${tokens.font.family} Semibold`, url: serifSemibold }),
  ])
}
```

Note: `*?url` imports are typed by `vite/client` (`declare module '*?url'`), already referenced in `src/vite-env.d.ts`. No new declarations needed. `fonts.ts` is exercised through `generateDocx` (mocked in unit tests — `fetch` of Vite asset URLs is unavailable under jsdom).

- [ ] **Step 5: Keep docx out of eager chunks**

In `vite.config.ts` `manualChunks`, add a branch after the `@react-pdf` case:

```ts
} else if (
  id.includes("node_modules/docx/") ||
  id.includes("node_modules/buffer/") ||
  id.includes("node_modules/fflate/")
) {
  // Only reachable through the lazy-loaded Word export on the edit page.
  return "docx"
}
```

- [ ] **Step 6: Verify**

Run: `bun run ts:check && bun run build`
Expected: both PASS; build output lists a `docx-*.js` chunk only if referenced (it isn't yet — that's fine, no chunk appears until Task 5 wires imports).

- [ ] **Step 7: Commit**

```bash
bun run prettier
git add -A
git commit -m "CJR: add docx deps, vendored Source Serif 4 TTFs, and font loader

- docx 9.7.1 + buffer shim (exact pins), fflate as dev dep
- vendors Regular/Semibold TTFs with OFL license
- @docx alias and lazy docx manual chunk"
```

---

### Task 4: `ResumeDocx` document builder

**Files:**

- Create: `src/test/resumeFixture.ts`
- Create: `src/docx/ResumeDocx.ts`
- Create: `src/docx/ResumeDocx.test.ts`

**Interfaces:**

- Consumes: `tokens` from `@theme/tokens` (Task 2); `type DocxFont` from `@docx/fonts` (Task 3, type-only); `isEmail`, `isUrl`, `stripProtocol` from `@utils/contact` (existing).
- Produces: `buildResumeDocument({ data, fonts }: { data: Data; fonts: DocxFont[] }): Document` from `@docx/ResumeDocx`; `resumeFixture: Data` from `@app/test/resumeFixture`. Task 5 uses both.

- [ ] **Step 1: Create the shared test fixture**

Create `src/test/resumeFixture.ts` (in `src/test/` so it stays out of coverage):

```ts
export const resumeFixture: Data = {
  name: "Ada Lovelace",
  title: "Analytical Engineer",
  summary: "Wrote the first published algorithm.",
  contact: [
    { label: "email", value: "ada@example.com" },
    { label: "site", value: "https://ada.dev/" },
    { label: "location", value: "London, UK" },
  ],
  technical_skills: ["Punch Cards", "Algorithms"],
  skill_descriptions: [],
  work_experience: [
    {
      role: "Engine Analyst",
      company: "Babbage & Co",
      period: "1842 – 1843",
      achievements: ["Wrote the first algorithm", "Annotated the memoir"],
    },
  ],
  awards: [{ name: "STEM Pioneer", organization: "Royal Society", year: 1843 }],
  languages: [{ name: "English", proficiency: "Native" }],
  education: [{ program: "Mathematics", institution: "Private tutelage" }],
  showcase: [],
}
```

- [ ] **Step 2: Write the failing test**

Create `src/docx/ResumeDocx.test.ts`. Tests unzip the packed document with `fflate` and assert on the OOXML parts (this exact approach was dry-run against `docx@9.7.1` — all assertions verified passing):

```ts
import { buildResumeDocument } from "@docx/ResumeDocx"
import type { DocxFont } from "@docx/fonts"
import { Buffer } from "buffer"
import { Packer } from "docx"
import { strFromU8, unzipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { resumeFixture } from "@app/test/resumeFixture"

async function unzipDocument(fonts: DocxFont[] = []) {
  const blob = await Packer.toBlob(
    buildResumeDocument({ data: resumeFixture, fonts })
  )
  return unzipSync(new Uint8Array(await blob.arrayBuffer()))
}

describe("buildResumeDocument", () => {
  it("renders every section in the PDF's order", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    const order = [
      resumeFixture.name,
      resumeFixture.title,
      resumeFixture.summary,
      "Technical Skills",
      "Punch Cards",
      "Work Experience",
      "Engine Analyst",
      "Babbage &amp; Co",
      "Wrote the first algorithm",
      "Awards",
      "STEM Pioneer",
    ]
    const positions = order.map((text) => xml.indexOf(text))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(xml.includes("Languages")).toBe(true)
    expect(xml.includes("Education")).toBe(true)
  })

  it("links urls and emails in the contact bar", async () => {
    const rels = strFromU8(
      (await unzipDocument())["word/_rels/document.xml.rels"]
    )
    expect(rels.includes("https://ada.dev/")).toBe(true)
    expect(rels.includes("mailto:ada@example.com")).toBe(true)
    expect(rels.includes("London")).toBe(false)
  })

  it("applies the theme: shading, caps headings, kept-together entries", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    expect(xml.includes("2C4A5C")).toBe(true) // accentDeep fill
    expect(xml.includes("35576B")).toBe(true) // accent color
    expect(xml.includes("w:caps")).toBe(true) // allCaps headings
    expect(xml.includes("w:keepNext")).toBe(true) // wrap={false} equivalent
    expect(xml.includes("Source Serif 4 Semibold")).toBe(true) // company runs
  })

  it("emits a footer with the name and page-number fields", async () => {
    const footer = strFromU8((await unzipDocument())["word/footer1.xml"])
    expect(footer.includes(resumeFixture.name)).toBe(true)
    expect(footer.includes("PAGE")).toBe(true)
    expect(footer.includes("NUMPAGES")).toBe(true)
  })

  it("embeds provided fonts in the font table", async () => {
    const files = await unzipDocument([
      { name: "Source Serif 4", data: Buffer.alloc(64) },
    ])
    expect(
      strFromU8(files["word/fontTable.xml"]).includes("Source Serif 4")
    ).toBe(true)
    expect(Object.keys(files).some((f) => f.endsWith(".odttf"))).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun run test -- src/docx/ResumeDocx.test.ts`
Expected: FAIL — cannot resolve `@docx/ResumeDocx`.

- [ ] **Step 4: Write the builder**

Create `src/docx/ResumeDocx.ts`. This code was dry-run end-to-end (type-checked strict, packed, unzipped, opened structure verified) — copy it exactly:

```ts
import { tokens } from "@theme/tokens"
import type { Buffer } from "buffer"
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  LineRuleType,
  PageNumber,
  Paragraph,
  ShadingType,
  Tab,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx"

import { isEmail, isUrl, stripProtocol } from "@utils/contact"

type ContactChild = TextRun | ExternalHyperlink

export type DocxFont = { name: string; data: Buffer }

// react-pdf styles are in points; Word wants half-points for font sizes and
// twentieths of a point (twips/dxa) for lengths.
const halfPoints = (pt: number) => Math.round(pt * 2)
const twips = (pt: number) => Math.round(pt * 20)
const hex = (color: string) => color.replace("#", "").toUpperCase()

// 240ths of a line, mirroring the PDF's unitless line-heights.
const lineOf = (lineHeight: number) => Math.round(lineHeight * 240)

const PAGE_WIDTH = twips(612) // LETTER: 8.5in
const PAGE_HEIGHT = twips(792) // LETTER: 11in
const MARGIN_X = twips(tokens.page.paddingHorizontal)
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const FONT = tokens.font.family
const FONT_SEMIBOLD = `${tokens.font.family} Semibold`

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" }
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
}

function headerParagraphs(data: Data): Paragraph[] {
  return [
    new Paragraph({
      spacing: { after: twips(tokens.spacing.xs) },
      children: [
        new TextRun({
          text: data.name,
          bold: true,
          size: halfPoints(tokens.fontSize.h1),
          characterSpacing: twips(0.2),
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: twips(tokens.spacing.xs) },
      children: [
        new TextRun({
          text: data.title,
          color: hex(tokens.colors.accent),
          size: halfPoints(tokens.fontSize.subtitle),
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: twips(tokens.spacing.lg) },
      children: [new TextRun({ text: data.summary })],
    }),
  ]
}

function contactChild(value: string): ContactChild {
  const style = {
    color: hex(tokens.colors.onAccent),
    size: halfPoints(tokens.fontSize.small),
  }
  if (isUrl(value)) {
    return new ExternalHyperlink({
      link: value,
      children: [new TextRun({ text: stripProtocol(value), ...style })],
    })
  }
  if (isEmail(value)) {
    return new ExternalHyperlink({
      link: `mailto:${value}`,
      children: [new TextRun({ text: value, ...style })],
    })
  }
  return new TextRun({ text: value, ...style })
}

// The PDF's full-bleed contact bar: a borderless single-row table spanning
// the full page width (negative indent cancels the page margin), one shaded
// cell per entry, outer cells padded back to the content edge.
function contactBar(data: Data): Table {
  const count = data.contact.length
  const width = Math.floor(PAGE_WIDTH / count)
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    indent: { size: -MARGIN_X, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    columnWidths: data.contact.map(() => width),
    rows: [
      new TableRow({
        children: data.contact.map(
          (entry, i) =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: hex(tokens.colors.accentDeep),
              },
              margins: {
                top: twips(tokens.spacing.sm),
                bottom: twips(tokens.spacing.sm),
                left: i === 0 ? MARGIN_X : twips(tokens.spacing.md),
                right: i === count - 1 ? MARGIN_X : twips(tokens.spacing.md),
              },
              children: [
                new Paragraph({
                  alignment:
                    i === 0
                      ? AlignmentType.LEFT
                      : i === count - 1
                        ? AlignmentType.RIGHT
                        : AlignmentType.CENTER,
                  children: [contactChild(entry.value)],
                }),
              ],
            })
        ),
      }),
    ],
  })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: {
      before: twips(tokens.spacing.lg),
      after: twips(tokens.spacing.md),
    },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8, // eighths of a point: a 1pt rule
        space: tokens.spacing.xs, // points between text and rule
        color: hex(tokens.colors.rule),
      },
    },
    children: [
      new TextRun({
        text,
        allCaps: true,
        bold: true,
        color: hex(tokens.colors.accent),
        size: halfPoints(tokens.fontSize.h2),
        characterSpacing: twips(1.2),
      }),
    ],
  })
}

// Skill pills: shaded runs padded with spaces; extra line spacing keeps
// wrapped pill rows from touching (Word has no border-radius on runs).
function skillPills(skills: string[]): Paragraph {
  return new Paragraph({
    spacing: { line: lineOf(1.5), lineRule: LineRuleType.AUTO },
    children: skills.flatMap((skill, i) => {
      const pill = new TextRun({
        text: ` ${skill} `,
        color: hex(tokens.colors.onAccent),
        size: halfPoints(tokens.fontSize.small),
        shading: {
          type: ShadingType.CLEAR,
          fill: hex(tokens.colors.accentDeep),
        },
      })
      return i === 0 ? [pill] : [new TextRun({ text: "  " }), pill]
    }),
  })
}

// One experience entry, indented like the PDF's timeline block: the accent
// dash hangs in the gutter, role/period share a line via a right tab stop,
// and keepNext/keepLines emulate the PDF's wrap={false}.
function experienceParagraphs(entry: Experience): Paragraph[] {
  const indent = twips(22)
  return [
    new Paragraph({
      keepNext: true,
      keepLines: true,
      indent: { left: indent, hanging: indent },
      tabStops: [
        { type: TabStopType.LEFT, position: indent },
        { type: TabStopType.RIGHT, position: CONTENT_WIDTH },
      ],
      children: [
        new TextRun({
          children: ["—", new Tab()],
          bold: true,
          color: hex(tokens.colors.accent),
        }),
        new TextRun({
          text: entry.role,
          bold: true,
          size: halfPoints(tokens.fontSize.h3),
        }),
        new TextRun({ children: [new Tab()] }),
        new TextRun({
          text: entry.period,
          italics: true,
          size: halfPoints(tokens.fontSize.small),
          color: hex(tokens.colors.muted),
        }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      keepLines: true,
      indent: { left: indent },
      spacing: { after: twips(3) },
      children: [
        new TextRun({
          text: entry.company,
          font: FONT_SEMIBOLD,
          color: hex(tokens.colors.accent),
        }),
      ],
    }),
    ...entry.achievements.map(
      (achievement, i) =>
        new Paragraph({
          keepNext: i < entry.achievements.length - 1,
          keepLines: true,
          indent: { left: indent + twips(10), hanging: twips(10) },
          spacing: {
            line: lineOf(1.3),
            lineRule: LineRuleType.AUTO,
            after:
              i === entry.achievements.length - 1
                ? twips(tokens.spacing.lg)
                : twips(2),
          },
          children: [
            new TextRun({ text: "•  ", color: hex(tokens.colors.accent) }),
            new TextRun({ text: achievement }),
          ],
        })
    ),
  ]
}

function metaItemParagraphs({
  primary,
  secondary,
}: {
  primary: string
  secondary: string
}): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: primary, bold: true })],
    }),
    new Paragraph({
      spacing: { after: twips(tokens.spacing.sm) },
      children: [
        new TextRun({
          text: secondary,
          size: halfPoints(tokens.fontSize.small),
          color: hex(tokens.colors.muted),
        }),
      ],
    }),
  ]
}

// Awards / Languages / Education as a borderless three-column table.
function metaRow(data: Data): Table {
  const width = Math.floor(CONTENT_WIDTH / 3)
  const columns: { heading: string; items: Paragraph[] }[] = [
    {
      heading: "Awards",
      items: data.awards.flatMap((award) =>
        metaItemParagraphs({
          primary: award.name,
          secondary: `${award.organization} · ${award.year}`,
        })
      ),
    },
    {
      heading: "Languages",
      items: data.languages.flatMap((lang) =>
        metaItemParagraphs({ primary: lang.name, secondary: lang.proficiency })
      ),
    },
    {
      heading: "Education",
      items: data.education.flatMap((ed) =>
        metaItemParagraphs({ primary: ed.program, secondary: ed.institution })
      ),
    },
  ]
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    columnWidths: columns.map(() => width),
    rows: [
      new TableRow({
        children: columns.map(
          ({ heading, items }, i) =>
            new TableCell({
              margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: i === columns.length - 1 ? 0 : twips(tokens.spacing.xl),
              },
              children: [sectionHeading(heading), ...items],
            })
        ),
      }),
    ],
  })
}

function pageFooter(name: string): Footer {
  const style = {
    italics: true,
    size: halfPoints(tokens.fontSize.micro),
    color: hex(tokens.colors.muted),
  }
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `${name}  ·  Page `, ...style }),
          new TextRun({ children: [PageNumber.CURRENT], ...style }),
          new TextRun({ text: " of ", ...style }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], ...style }),
        ],
      }),
    ],
  })
}

export function buildResumeDocument({
  data,
  fonts,
}: {
  data: Data
  fonts: DocxFont[]
}): Document {
  return new Document({
    title: `${data.name} - ${data.title}`,
    creator: data.name,
    subject: "Resume",
    fonts,
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: halfPoints(tokens.fontSize.body),
            color: hex(tokens.colors.text),
          },
          paragraph: {
            spacing: { line: lineOf(1.45), lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: {
              top: twips(tokens.page.paddingTop),
              bottom: twips(tokens.page.paddingBottom),
              left: MARGIN_X,
              right: MARGIN_X,
              footer: twips(tokens.spacing.xl),
            },
          },
        },
        footers: { default: pageFooter(data.name) },
        children: [
          ...headerParagraphs(data),
          contactBar(data),
          sectionHeading("Technical Skills"),
          skillPills(data.technical_skills),
          sectionHeading("Work Experience"),
          ...data.work_experience.flatMap(experienceParagraphs),
          metaRow(data),
        ],
      },
    ],
  })
}
```

Note: `DocxFont` is declared here **and** in `@docx/fonts` with the same shape. Keep the `ResumeDocx.ts` copy — it lets the builder stay import-free of the fetch-based loader — but the test imports the type from `@docx/fonts` (type-only, erased at runtime). They are structurally identical so both compile everywhere.

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test -- src/docx/ResumeDocx.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
bun run prettier
git add -A
git commit -m "CJR: add ResumeDocx Word document builder

- mirrors ResumePDF layout with Word-native constructs
- shaded contact-bar table, pill runs, tabbed role/period, meta columns
- footer with PAGE/NUMPAGES fields; tests unzip and assert on OOXML"
```

---

### Task 5: `generateResumeDocx` and the `@docx` barrel

**Files:**

- Create: `src/docx/generateDocx.ts`
- Create: `src/docx/generateDocx.test.ts`
- Create: `src/docx/index.ts`

**Interfaces:**

- Consumes: `buildResumeDocument` (Task 4), `loadDocxFonts` (Task 3).
- Produces: `generateResumeDocx(data: Data): Promise<Blob>` exported from `@docx` alongside a `downloadBlob` re-export — mirroring `@pdf`'s barrel exactly. Task 6 lazy-imports `@docx`.

- [ ] **Step 1: Write the failing test**

Create `src/docx/generateDocx.test.ts`:

```ts
import { generateResumeDocx } from "@docx/generateDocx"
import { describe, expect, it, vi } from "vitest"

import { resumeFixture } from "@app/test/resumeFixture"

vi.mock("@docx/fonts", () => ({
  loadDocxFonts: vi.fn().mockResolvedValue([]),
}))

describe("generateResumeDocx", () => {
  it("resolves to a non-empty .docx blob", async () => {
    const blob = await generateResumeDocx(resumeFixture)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  })
})
```

(The MIME type assertion is safe: `Packer.toBlob` sets it — verified in the dry run.)

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/docx/generateDocx.test.ts`
Expected: FAIL — cannot resolve `@docx/generateDocx`.

- [ ] **Step 3: Write the implementation**

Create `src/docx/generateDocx.ts`:

```ts
import { buildResumeDocument } from "@docx/ResumeDocx"
import { loadDocxFonts } from "@docx/fonts"
import { Packer } from "docx"

export async function generateResumeDocx(data: Data): Promise<Blob> {
  const fonts = await loadDocxFonts()
  return await Packer.toBlob(buildResumeDocument({ data, fonts }))
}
```

Create `src/docx/index.ts` (mirrors `src/pdf/index.ts`):

```ts
export { generateResumeDocx } from "@docx/generateDocx"
export { downloadBlob } from "@utils/downloadBlob"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/docx/generateDocx.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
bun run prettier
git add -A
git commit -m "CJR: add generateResumeDocx and @docx barrel

- loads embedded fonts, packs the document to a Blob
- re-exports downloadBlob to mirror @pdf"
```

---

### Task 6: Wire the Generate Word button

**Files:**

- Modify: `src/edit/EditResumeApp.tsx:89-94` (onGenerate)
- Modify: `src/edit/VariationsPanel.tsx:22,27,132-134` (prop type + buttons)
- Modify: `src/edit/VariationsPanel.test.tsx` (new test)

**Interfaces:**

- Consumes: `@docx` barrel (Task 5), `documentFileName` + `DocumentFormat` (Task 1).
- Produces: `VariationsPanel`'s `onGenerate` prop becomes `(format: DocumentFormat) => void`. Existing test renders pass `noop = () => {}`, which remains assignable — no churn in existing tests.

- [ ] **Step 1: Write the failing test**

In `src/edit/VariationsPanel.test.tsx`, add inside `describe("VariationsPanel")`:

```ts
it("generates the chosen document format", () => {
  const onGenerate = vi.fn()
  render(
    <VariationsPanel
      dirty={false}
      onSave={noop}
      onGenerate={onGenerate}
      onNew={noop}
    />
  )
  fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }))
  expect(onGenerate).toHaveBeenCalledWith("pdf")
  fireEvent.click(screen.getByRole("button", { name: "Generate Word" }))
  expect(onGenerate).toHaveBeenCalledWith("docx")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/edit/VariationsPanel.test.tsx`
Expected: FAIL — no button named "Generate Word".

- [ ] **Step 3: Update VariationsPanel**

In `src/edit/VariationsPanel.tsx`, add the type import:

```ts
import type { DocumentFormat } from "@utils/documentFileName"
```

Change the prop type (line 27):

```ts
onGenerate: (format: DocumentFormat) => void
```

Replace the single generate button (lines 132–134) with:

```tsx
<button type="button" onClick={() => onGenerate("pdf")}>
  Generate PDF
</button>
<button type="button" onClick={() => onGenerate("docx")}>
  Generate Word
</button>
```

- [ ] **Step 4: Update EditResumeApp's onGenerate**

In `src/edit/EditResumeApp.tsx`, add the type import and replace the `onGenerate` callback (lines 89–94):

```ts
import { type DocumentFormat, documentFileName } from "@utils/documentFileName"
```

```ts
const onGenerate = useCallback(
  async (format: DocumentFormat) => {
    const data = useStore.getState()
    const filename = documentFileName({
      name: data.name,
      label: activeName || data.title,
      extension: format,
    })
    if (format === "docx") {
      const { generateResumeDocx, downloadBlob } = await import("@docx")
      downloadBlob(await generateResumeDocx(data), filename)
      return
    }
    const { generateResumePdf, downloadBlob } = await import("@pdf")
    downloadBlob(await generateResumePdf(data), filename)
  },
  [activeName]
)
```

- [ ] **Step 5: Run the edit-suite tests**

Run: `bun run test -- src/edit`
Expected: PASS — existing `VariationsPanel`/`EditResumeApp`/cloud tests are unaffected (`noop` stays assignable to the widened prop), and the new test passes.

- [ ] **Step 6: Commit**

```bash
bun run prettier
git add -A
git commit -m "CJR: add Generate Word button to the variations panel

- onGenerate now takes a pdf/docx format
- EditResumeApp lazy-loads @docx and downloads the blob"
```

---

### Task 7: Full verification

- [ ] **Step 1: Run the complete system check**

Run: `bun run system-check`
Expected: prettier:check, ts:check (app + netlify), eslint, vitest, and build all PASS. Build output includes a lazy `docx-*.js` chunk and the two TTF assets.

- [ ] **Step 2: Manual smoke test**

Run: `bun dev`, open `http://localhost:4242/generate`, click **Generate Word**. Expected: a `CJ Rivas - <title>.docx` downloads (~600KB) and opens in Word/Pages with the themed layout (colored contact bar, pills, timeline dashes, footer page numbers).

- [ ] **Step 3: Commit any straggler formatting and stop**

If `git status` is dirty after the system check, run `bun run prettier`, commit as `CJR: formatting`, and stop. Do not push or open a PR unless asked.
