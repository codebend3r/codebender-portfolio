# Word (.docx) Export — Design

**Date:** 2026-07-09
**Status:** Approved

## Goal

Add a Word (.docx) download to the `/generate` route alongside the existing PDF
download, matching the PDF's formatting and style as closely as Word's layout
model allows. Generation stays fully client-side.

## Background

The PDF is built with `@react-pdf/renderer` (`src/pdf/`): a declarative
component tree (`ResumePDF.tsx`) styled from shared theme tokens
(`src/pdf/tokens.ts`), rendered to a `Blob` and downloaded via
`downloadBlob`. The `/generate` route triggers it from
`EditResumeApp.onGenerate` through the `VariationsPanel` footer button.

## Approach

Use the `docx` library (dolanmiu/docx) — the .docx counterpart to
`@react-pdf/renderer`: declarative, TypeScript-first, browser-capable,
outputs a `Blob` via `Packer.toBlob()`. No server involved.

Alternatives rejected:

- **HTML→docx converters** (`html-to-docx`, `html-docx-js`): stale libraries;
  flexbox layouts (pills, contact bar, meta columns) degrade badly.
- **Server-side conversion** (LibreOffice / cloud API): not viable on the
  Netlify Free plan (30s function cap, large binaries, or paid APIs), and
  PDF→DOCX conversion produces messy, hard-to-edit documents.

## Architecture

New `src/docx/` module mirroring `src/pdf/`:

```
src/docx/
  index.ts            → exports generateResumeDocx
  generateDocx.ts     → generateResumeDocx(data): Promise<Blob>
  ResumeDocx.ts       → pure builder fns: Data → docx Document (mirrors ResumePDF)
  fonts.ts            → loads vendored TTFs as ArrayBuffers for embedding
  fonts/              → vendored Source Serif 4 TTFs (Regular 400, Semibold 600)
```

- **Shared tokens:** hoist `src/pdf/tokens.ts` → `src/theme/tokens.ts` with a
  new `@theme` alias (tsconfig + vite). Both `src/pdf` and `src/docx` import
  it, so colors/sizes/spacing stay in lockstep by construction.
- **New aliases:** `@theme/*` and `@docx` / `@docx/*`.
- **Dependencies:** `docx` and `buffer` (browser shim for the font-embedding
  API, verified to type-check with no casts), pinned to exact versions;
  `fflate` as a devDependency for unzipping .docx output in tests.
- **Bundle:** dynamic `import("@docx")` at generate time (same pattern as
  `@pdf`); add a `docx` manual chunk in `vite.config.ts` so it stays out of
  eager chunks.

## Fonts

`@fontsource/source-serif-4` only ships woff/woff2, but docx font embedding
needs TTF. Vendor Source Serif 4 TTFs (OFL license permits redistribution)
under `src/docx/fonts/`, import them with `?url`, fetch to `ArrayBuffer`, and
embed via the `Document` `fonts` option.

Verified against `docx@9.7.1` and the 4.005R TTF name tables:

- docx's public `fonts` API writes `embedRegular` only — one face per
  font-table name. Regular/Bold/Italic are style-linked under the family
  `"Source Serif 4"`; Semibold is its own legacy family
  `"Source Serif 4 Semibold"`.
- Therefore embed **two** faces under their true family names: Regular as
  `"Source Serif 4"`, Semibold as `"Source Serif 4 Semibold"` (used by
  company lines). Bold/italic runs use Word's `bold`/`italics` flags: real
  style-linked faces when the font is installed, synthesized rendering from
  the embedded Regular when not.
- Resulting .docx is ~600KB — acceptable for a resume.
- Word desktop/Mac honors embedded fonts; Google Docs may fall back to a
  stock serif.
- `docx` types the font `data` field as `Buffer`; the `buffer` shim package
  satisfies it with **no type casts** (verified with TS 6 strict).

## Layout mapping (PDF → Word)

| PDF element                                    | Word equivalent                                                                           | Fidelity    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| Colors, font sizes, section rules              | Direct from shared `@theme` tokens                                                        | ~exact      |
| Source Serif 4                                 | Embedded Regular + Semibold TTFs; bold/italic style-linked or synthesized                 | very close  |
| Footer `Name · Page X of Y`                    | Footer with `PAGE` / `NUMPAGES` fields, right-aligned italic muted                        | ~exact      |
| Page (LETTER, paddings)                        | LETTER section, margins converted pt → twips                                              | ~exact      |
| Full-bleed contact bar                         | Full-width single-row borderless table, `accentDeep` shading, white text, real hyperlinks | very close  |
| 3-column meta row (Awards/Languages/Education) | Borderless 3-column table                                                                 | very close  |
| Section headings                               | Uppercase accent heading with bottom border                                               | ~exact      |
| Skill pills                                    | Shaded text runs (`accentDeep` bg, white text; square corners)                            | approximate |
| Experience timeline dash                       | Accent-colored dash run before the role                                                   | approximate |
| Role / period on one line                      | Right tab stop                                                                            | very close  |
| `wrap={false}` (keep entry on one page)        | `keepLines` + `keepNext`                                                                  | very close  |

## UI & wiring

- `VariationsPanel` footer: second button **Generate Word** below
  **Generate PDF**, same styling. The `onGenerate` prop becomes
  `onGenerate: (format: DocumentFormat) => void` — one prop, two buttons.
- `EditResumeApp`: `onGenerate` branches on format — `await import("@pdf")`
  or `await import("@docx")`, build blob, download.
- Filename: replace `pdfFileName(name, label)` with
  `documentFileName({ name, label, extension })` in
  `src/utils/documentFileName.ts` (object param per repo style); update both
  call sites (`App.tsx`, `EditResumeApp.tsx`) and tests; delete
  `pdfFileName`.
- Scope: `/generate` route only. The main-page download stays PDF-only.

## Error handling

Same failure surface as the PDF path — the existing generate flow's error
handling applies unchanged (async callback, download only on success).

## Testing

Co-located per repo convention:

- `src/utils/documentFileName.test.ts` — filename building, illegal chars,
  extension handling.
- `src/docx/ResumeDocx.test.ts` — builds the document, unzips the packed
  output with `fflate`, and asserts on `word/document.xml` /
  `word/footer1.xml` / `word/fontTable.xml`: sections present, text order,
  shading colors, page-number fields, embedded font entries.
- `src/docx/generateDocx.test.ts` — resolves to a non-empty `Blob` with the
  docx MIME type (fonts loader mocked).
- `EditResumeApp` / `VariationsPanel` tests updated for the new button,
  mocking `@docx` the same way `@pdf` is mocked.

## Out of scope

- Word export on the main page (`App.tsx` download button).
- ATS-specific plain formatting mode.
- Font subsetting to shrink file size.
