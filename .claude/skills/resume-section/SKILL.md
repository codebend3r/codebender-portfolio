---
name: resume-section
description: Use when adding, removing, or reshaping anything in `src/data/resume.json` — a new section, a new field on an existing section, or a renamed key. The same data renders to four independent targets (React, PDF, DOCX, Angular) and a missing field fails silently in three of them.
---

# Changing Resume Data

## Overview

`src/data/resume.json` is the single source of truth for a resume that renders through
**four independent pipelines**:

| Target | Entry point | Failure mode when a field is missed |
|---|---|---|
| React (screen) | `src/components/*` mounted in `src/App.tsx` | visible immediately |
| PDF | `src/pdf/ResumePDF.tsx` | field silently absent from the download |
| DOCX | `src/docx/ResumeDocx.ts` | field silently absent from the download |
| Angular | `src/angular/components/*` | field silently absent from `/angular-version` |

Only the first is visible while you work. The other three render correctly, pass their
tests, build clean, and quietly drop your new field — because **no test asserts that a
key in `resume.json` reaches any particular target**. Nothing is red. The data is just
gone.

That asymmetry is the whole reason this skill exists.

## The Sequence

Work top to bottom. Each step is a real file, not a category.

1. **`src/data/resume.json`** — add the data. This is the source of truth.
2. **`src/types/global.d.ts`** — add or extend the type. These are *ambient*: referenced
   everywhere without import. New object shapes get their own type alias (never an
   `interface` — see `CLAUDE.md`), then join the `Data` type.
3. **`src/utils/normalizeData.ts`** — if the field needs defaulting or narrowing from raw
   JSON, do it here. `useStore` runs every load through `normalizeData`, so this is the
   one chokepoint that both the initial seed and `loadData` pass through.
4. **`src/state/useStore.ts`** — the store spreads `normalizeData(...)`, so a new key on
   `Data` arrives for free. You only edit this file for new *behaviour*: an
   `addX`/`removeX` action, or a seed constant like `NEW_EXPERIENCE`. The store type is
   `ResumeStore` in `src/types/global.d.ts`, not a local `StoreState`.
5. **`src/components/<Section>.tsx`** + `<Section>.module.css` — the screen component.
   Read the slice with `useStore()`. Co-locate the test as a sibling.
6. **`src/App.tsx`** — mount it. Sections take sequential `index` and an `eyebrow` label;
   keep the numbering contiguous, since `SectionNav` relies on it.
7. **`src/pdf/ResumePDF.tsx`** — print rendering. Colors come from `src/theme/tokens.ts`,
   **not** `src/styles/tokens.css`.
8. **`src/docx/ResumeDocx.ts`** — Word rendering. Structurally unlike the PDF: paragraph
   and run builders, not components.
9. **`src/angular/components/<section>.component.ts`** + `.css` — the React-free mirror.
   Co-locate its `.test.ts` too.
10. **Tests** — a sibling test per file touched, plus register the new key in
    `src/data/resumeCoverage.test.ts` (below).

## The Coverage Test Is the Backstop

`src/data/resumeCoverage.test.ts` asserts that **every top-level key in `resume.json`
is referenced by every render target**, or is explicitly registered as intentionally
omitted with a stated reason.

This is the only thing standing between a new field and a silent drop. When it fails,
there are exactly two correct responses:

- **Render the field in the target it's missing from.** Usually right.
- **Register the omission with a reason**, if the field genuinely doesn't belong there
  (a hover tooltip has no meaning in print).

Deleting the assertion or loosening the matcher is never the fix.

## Shared Derivations Belong in `src/utils/`

When a field needs formatting, put the logic in `src/utils/` and call it from all four
targets. `employmentParts` in `src/utils/employment.ts` is the model: one function,
imported by `WorkExperience.tsx`, `ResumePDF.tsx`, `ResumeDocx.ts`, and
`work-experience.component.ts`. Four renderers, one rule, one place to fix a bug.

Reimplementing the formatting per target is how the targets drift apart.

## Two Token Systems

Screen and print do **not** share tokens:

- `src/styles/tokens.css` — CSS custom properties for the screen (dark palette).
- `src/theme/tokens.ts` — TypeScript hexes for PDF/DOCX (print palette).

A color used in both must be changed in both. `tokens.css` already carries a comment
tying the employment colors to their print counterparts — respect it.

## Verify

```bash
bun run test           # includes the coverage test
bun typecheck          # ambient types reach all three tsconfig projects
bun run build          # also runs assert:no-react over the Angular entry
```

Then look at the actual artifacts — the tests prove a key is *referenced*, not that it
*renders legibly*:

```bash
bun dev                # screen; add ?sky=day for a stable background
```

## Red Flags

| Thought | Reality |
|---|---|
| "It shows up on the page, I'm done" | Screen is 1 of 4 targets. Check PDF, DOCX, Angular. |
| "Tests pass, so every target has it" | Without the coverage test, nothing asserts that. That's the trap. |
| "The Angular version is a demo, it can lag" | It ships at `/angular-version` and is build-gated by `assert:no-react`. Keep it level. |
| "I'll add a `StoreState` field" | There is no `StoreState`. The type is `ResumeStore` in `global.d.ts`. |
| "I'll format the date inline in the PDF too" | Put it in `src/utils/` and import it in all four. See `employmentParts`. |
| "Print can reuse `--accent` from `tokens.css`" | Print reads `src/theme/tokens.ts`. CSS custom properties don't exist in `@react-pdf` or `docx`. |
| "The coverage test is failing, I'll add my key to the omit list" | Only if the field genuinely has no meaning there — and write the reason. |
| "I'll use an `interface` for the new section type" | Type aliases only. See `CLAUDE.md`. |
| "New section, I'll give it `index={9}` to be safe" | Indexes are contiguous and drive `SectionNav`. Renumber. |

## Checklist

- [ ] `resume.json` updated
- [ ] type added/extended in `src/types/global.d.ts` (type alias, not interface)
- [ ] `normalizeData.ts` handles defaults/narrowing if needed
- [ ] `useStore.ts` touched only if new actions are needed
- [ ] screen component + `.module.css` + sibling test
- [ ] mounted in `App.tsx` with contiguous `index`
- [ ] rendered in `src/pdf/ResumePDF.tsx`
- [ ] rendered in `src/docx/ResumeDocx.ts`
- [ ] rendered in `src/angular/components/` + sibling test
- [ ] shared formatting extracted to `src/utils/` and used by all four
- [ ] key registered in `src/data/resumeCoverage.test.ts` (rendered, or omitted with a reason)
- [ ] `bun run test`, `bun typecheck`, `bun run build` all pass
- [ ] PDF and DOCX opened and eyeballed
