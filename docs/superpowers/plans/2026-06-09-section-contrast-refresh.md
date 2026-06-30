# Section contrast and hierarchy refresh implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the tinted-glass panel treatment and small typographic-hierarchy lift described in `docs/superpowers/specs/2026-06-09-section-contrast-design.md` to every section of the portfolio.

**Architecture:** Presentational only. Two new CSS tokens, a small prop addition to the `Section` component (numbered "eyebrow" chip), updated CSS for `Section` and `WorkExperience`, and one-line forwarding edits in the five `Section` consumers plus `App.tsx`. No data shape changes, no new dependencies, no new state.

**Tech Stack:** Vite, React 19, TypeScript, plain CSS Modules, Zustand (untouched), Vitest + Testing Library for tests.

---

## Reference docs

- Spec: `docs/superpowers/specs/2026-06-09-section-contrast-design.md`
- Project conventions: `CLAUDE.md` (commands, spacing rules, code style)
- Commit format: every commit uses the `CJR:` prefix (see `codebender-portfolio-commit-format` skill or the existing `git log`)

## Commands you will run

- `bun ts:check` — TypeScript no-emit check
- `bun lint` — ESLint
- `bun prettier` — Prettier write (the pre-commit hook runs `prettier:check`, so format with `bun prettier` before committing)
- `bun test` — Vitest, all tests
- `bun test src/components/Section.test.tsx -t "name of test"` — single test
- `bun dev` — Vite dev server (visual verification in Task 6)
- `bun run build` — production build (the pre-commit hook runs it; the pre-push hook also runs it)

Pre-commit hook (`.husky/pre-commit`) runs `prettier:check`, `ts:check`, `lint`, `vitest run` in that order and aborts on the first failure. If `prettier:check` fails, run `bun prettier` and re-stage before committing.

## File map

Created: (none)

Modified:

- `src/styles/tokens.css` — add `--panel-overlay` and `--panel-edge`
- `src/components/Section.tsx` — add optional `index` and `eyebrow` props, render chip
- `src/components/Section.module.css` — replace panel recipe, add `.chip`/`.chipDot`, gradient h2, print/mobile blocks
- `src/components/Section.test.tsx` — add tests for chip presence/absence
- `src/components/TechnicalSkills.tsx` — accept + forward props
- `src/components/WorkExperience.tsx` — accept + forward props
- `src/components/Awards.tsx` — accept + forward props
- `src/components/Languages.tsx` — accept + forward props
- `src/components/Education.tsx` — accept + forward props
- `src/App.tsx` — pass `index` + `eyebrow` to each section (Summary skipped)
- `src/App.test.tsx` — assert chip text appears for non-Summary sections, not for Summary
- `src/components/WorkExperience.module.css` — replace `.item` panel with accent rail, remove h3 gradient, remove now-obsolete print block

---

## Task 1: Add panel tokens

**Files:**

- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add the two new tokens to `:root`**

Edit `src/styles/tokens.css` and insert the new variables after `--border` (before `--cloud-drift`). The exact RGBA values come straight from the spec ("Token additions" section): `--panel` at 78%, `--bg` at 82%, and `--accent` at 22%.

```css
:root {
  --bg: #0b0e14;
  --panel: #111622;
  --text: #e6ebf5;
  --muted: #9aa4b2;
  --accent: #7aa2f7;
  --accent2: #c678dd;
  --border: #1b2233;
  --panel-overlay: linear-gradient(
    180deg,
    rgba(17, 22, 34, 0.78),
    rgba(11, 14, 20, 0.82)
  );
  --panel-edge: rgba(122, 162, 247, 0.22);
  --cloud-drift: 0vw;
  /* ... rest unchanged ... */
}
```

- [ ] **Step 2: Verify nothing regressed**

Run: `bun ts:check && bun lint && bun test`
Expected: PASS, 124+ tests pass.

- [ ] **Step 3: Format and commit**

Run: `bun prettier`

```bash
git add src/styles/tokens.css
git commit -m "CJR: add \`--panel-overlay\` and \`--panel-edge\` tokens for sections"
```

---

## Task 2: Extend `Section` with `index` and `eyebrow` props (TDD)

**Files:**

- Modify: `src/components/Section.test.tsx`
- Modify: `src/components/Section.tsx`

- [ ] **Step 1: Add failing tests for the chip**

Append two new test cases to `src/components/Section.test.tsx`. The existing `describe("Section", ...)` block already has two tests; add these two inside the same block.

```tsx
it("renders a numbered eyebrow chip when given index and eyebrow", () => {
  render(
    <Section title="Stack" index={1} eyebrow="Stack">
      <p>body</p>
    </Section>
  )
  expect(screen.getByText("01 · Stack")).toBeInTheDocument()
})

it("does not render an eyebrow chip when index or eyebrow is missing", () => {
  render(
    <Section title="Summary">
      <p>body</p>
    </Section>
  )
  expect(screen.queryByText(/^\d{2} ·/)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the new tests and watch them fail**

Run: `bun test src/components/Section.test.tsx`
Expected: FAIL. The two new tests fail because `Section` does not yet accept `index`/`eyebrow` props or render a chip. The first failure should be a TypeScript error or a render-without-chip failure.

- [ ] **Step 3: Implement the chip in `Section.tsx`**

Replace the contents of `src/components/Section.tsx` with:

```tsx
import React from "react"

import styles from "@components/Section.module.css"

export function Section({
  title,
  index,
  eyebrow,
  children,
}: {
  title: string
  index?: number
  eyebrow?: string
  children: React.ReactNode
}) {
  const hasChip = index !== undefined && eyebrow !== undefined
  return (
    <section className={styles.section}>
      {hasChip && (
        <span className={styles.chip}>
          <span className={styles.chipDot} aria-hidden />
          {String(index).padStart(2, "0")} · {eyebrow}
        </span>
      )}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
```

Note: the chip uses `·` (middle dot, U+00B7), not `-` or an em/en dash.

- [ ] **Step 4: Run the Section tests and watch them pass**

Run: `bun test src/components/Section.test.tsx`
Expected: PASS, all 4 tests in the `Section` describe block.

- [ ] **Step 5: Run the full test suite to confirm no consumer regressed**

Run: `bun test`
Expected: PASS, 126 tests (124 prior + 2 new).

- [ ] **Step 6: Format and commit**

Run: `bun prettier`

```bash
git add src/components/Section.tsx src/components/Section.test.tsx
git commit -m "CJR: add \`index\` and \`eyebrow\` props to \`Section\` for numbered chip"
```

---

## Task 3: Refresh `Section.module.css` with the D treatment

**Files:**

- Modify: `src/components/Section.module.css`

This task is pure CSS. Tests will not change, but the existing test suite must still pass after the edit.

- [ ] **Step 1: Replace `Section.module.css` contents**

Replace the entire contents of `src/components/Section.module.css` with:

```css
.section {
  background: var(--panel-overlay);
  border: 1px solid var(--panel-edge);
  border-radius: 16px;
  padding: 22px 22px 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.section h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.015em;
  background: linear-gradient(90deg, var(--text) 0%, var(--accent2) 130%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.chip {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 4px 9px;
  border: 1px solid rgba(122, 162, 247, 0.35);
  border-radius: 999px;
  background: rgba(122, 162, 247, 0.08);
}

.chipDot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

@media (max-width: 700px) {
  .section {
    padding: 16px 16px 18px;
    border-radius: 12px;
    gap: 12px;
  }

  .section h2 {
    font-size: 19px;
  }
}

@media print {
  .section {
    background: var(--panel);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
  }

  .section h2 {
    background: none;
    -webkit-text-fill-color: initial;
    color: var(--text);
  }
}
```

- [ ] **Step 2: Run the test suite**

Run: `bun test`
Expected: PASS, 126 tests.

- [ ] **Step 3: Type-check and lint**

Run: `bun ts:check && bun lint`
Expected: clean.

- [ ] **Step 4: Format and commit**

Run: `bun prettier`

```bash
git add src/components/Section.module.css
git commit -m "CJR: refresh \`Section\` panel with tinted glass and gradient heading"
```

---

## Task 4: Forward props through every `Section` consumer

**Files:**

- Modify: `src/components/TechnicalSkills.tsx`
- Modify: `src/components/WorkExperience.tsx`
- Modify: `src/components/Awards.tsx`
- Modify: `src/components/Languages.tsx`
- Modify: `src/components/Education.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

Each consumer gains an optional `index` and `eyebrow` prop that it forwards to `<Section>`. `App.tsx` then passes concrete values to every section except `Summary`.

- [ ] **Step 1: Update `App.test.tsx` to assert chip presence and Summary absence**

In `src/App.test.tsx`, find the first test block (`it("renders the major resume sections in order", ...)`). Replace the section-titles loop with a richer assertion that checks each non-Summary section also renders its numbered chip and Summary does not.

Replace:

```tsx
for (const title of [
  "Summary",
  "Technical Skills",
  "Work Experience",
  "Awards",
  "Languages",
  "Education",
]) {
  expect(
    screen.getByRole("heading", { level: 2, name: title })
  ).toBeInTheDocument()
}
```

With:

```tsx
for (const title of [
  "Summary",
  "Technical Skills",
  "Work Experience",
  "Awards",
  "Languages",
  "Education",
]) {
  expect(
    screen.getByRole("heading", { level: 2, name: title })
  ).toBeInTheDocument()
}

for (const chip of [
  "01 · Stack",
  "02 · Experience",
  "03 · Recognition",
  "04 · Languages",
  "05 · Education",
]) {
  expect(screen.getByText(chip)).toBeInTheDocument()
}

expect(screen.queryByText(/^00 ·/)).not.toBeInTheDocument()
expect(screen.queryByText(/· Summary$/)).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the App test and watch it fail**

Run: `bun test src/App.test.tsx`
Expected: FAIL. The first test fails on the chip assertions because no consumer is passing `index`/`eyebrow` yet.

- [ ] **Step 3: Update `TechnicalSkills.tsx` to forward props**

Replace `src/components/TechnicalSkills.tsx` with:

```tsx
import { Section } from "@components/Section"
import styles from "@components/TechnicalSkills.module.css"

import { skillDescriptions } from "@data/skillDescriptions"

import { useStore } from "@state/useStore"

const fallbackDescription =
  "A core technology used across modern frontend engineering."

export function TechnicalSkills({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { technical_skills } = useStore()

  return (
    <Section title="Technical Skills" index={index} eyebrow={eyebrow}>
      <ul className={styles.pillList}>
        {technical_skills.map((s) => {
          const description = skillDescriptions[s] ?? fallbackDescription
          return (
            <li
              key={s}
              className={styles.pill}
              aria-label={`${s}: ${description}`}
            >
              {s}
              <span
                data-skill-tooltip
                role="tooltip"
                className={styles.tooltip}
              >
                {description}
              </span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 4: Update `WorkExperience.tsx` to forward props**

Edit the function signature and the `<Section>` opening tag in `src/components/WorkExperience.tsx`:

```tsx
export function WorkExperience({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { work_experience } = useStore()

  return (
    <Section title="Work Experience" index={index} eyebrow={eyebrow}>
      {/* ...rest of body unchanged... */}
    </Section>
  )
}
```

Leave the timeline `<ul>` and everything inside it untouched.

- [ ] **Step 5: Update `Awards.tsx` to forward props**

Replace `src/components/Awards.tsx` with:

```tsx
import { Section } from "@components/Section"

import { useStore } from "@state/useStore"

export function Awards({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { awards } = useStore()

  return (
    <Section title="Awards" index={index} eyebrow={eyebrow}>
      <ul>
        {awards.map((a) => (
          <li key={a.name + a.year}>
            <strong>{a.name}</strong> — {a.organization} ({a.year})
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 6: Update `Languages.tsx` to forward props**

Replace `src/components/Languages.tsx` with:

```tsx
import { Section } from "@components/Section"

import { useStore } from "@state/useStore"

export function Languages({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { languages } = useStore()

  return (
    <Section title="Languages" index={index} eyebrow={eyebrow}>
      <ul>
        {languages.map((l) => (
          <li key={l.name}>
            <strong>{l.name}:</strong> {l.proficiency}
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 7: Update `Education.tsx` to forward props**

Replace `src/components/Education.tsx` with:

```tsx
import { Section } from "@components/Section"

import { useStore } from "@state/useStore"

export function Education({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { education } = useStore()

  return (
    <Section title="Education" index={index} eyebrow={eyebrow}>
      <ul>
        {education.map((e) => (
          <li key={e.program + e.institution}>
            <strong>{e.program}</strong> — {e.institution}
            {e.details ? ` — ${e.details}` : ""}
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

- [ ] **Step 8: Pass concrete props in `App.tsx`**

In `src/App.tsx`, replace the `<main>` block (the one that renders Summary, TechnicalSkills, WorkExperience, and the subgrid) with:

```tsx
<main className={styles.main}>
  <Summary />
  <TechnicalSkills index={1} eyebrow="Stack" />
  <WorkExperience index={2} eyebrow="Experience" />

  <div className={styles.subgrid}>
    <Awards index={3} eyebrow="Recognition" />
    <Languages index={4} eyebrow="Languages" />
    <Education index={5} eyebrow="Education" />
  </div>
</main>
```

`Summary` is intentionally left without props so its chip is suppressed.

- [ ] **Step 9: Run the App test and watch it pass**

Run: `bun test src/App.test.tsx`
Expected: PASS, all 6 tests in the `App` describe block.

- [ ] **Step 10: Run the full test suite**

Run: `bun test`
Expected: PASS, 126 tests.

- [ ] **Step 11: Type-check and lint**

Run: `bun ts:check && bun lint`
Expected: clean.

- [ ] **Step 12: Format and commit**

Run: `bun prettier`

```bash
git add src/components/TechnicalSkills.tsx src/components/WorkExperience.tsx src/components/Awards.tsx src/components/Languages.tsx src/components/Education.tsx src/App.tsx src/App.test.tsx
git commit -m "CJR: wire section numbering through page consumers"
```

---

## Task 5: Replace `WorkExperience.item` panel with an accent rail

**Files:**

- Modify: `src/components/WorkExperience.module.css`

The Section is now the panel. The item flattens into the section interior with a fading accent rail down the left edge. The h3 drops its gradient so the section h2 gradient is the only one in the section. The print block reset for the h3 gradient is no longer needed and is removed.

- [ ] **Step 1: Replace `WorkExperience.module.css` contents**

Replace the entire contents of `src/components/WorkExperience.module.css` with:

```css
.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 16px;
}

.item {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 3px 1fr;
  column-gap: 14px;
  row-gap: 0;
}

.item::before {
  content: "";
  grid-column: 1;
  grid-row: 1 / -1;
  background: linear-gradient(180deg, var(--accent) 0%, transparent 100%);
  border-radius: 2px;
}

.item > .header,
.item > .bullets {
  grid-column: 2;
}

.item h3 {
  margin: 0;
  font-family: var(--font-role);
  font-style: italic;
  font-weight: 400;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.2px;
  color: var(--text);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.muted {
  color: var(--muted);
  margin: 2px 0 0;
}

.period {
  color: var(--accent2);
  font-family: var(--font-mono);
  font-weight: 700;
  white-space: nowrap;
}

.bullets {
  margin: 10px 0 0;
  padding-left: 22px;
}

@media (max-width: 700px) {
  .timeline {
    gap: 12px;
  }

  .item {
    grid-template-columns: 2px 1fr;
    gap: 10px;
  }

  .item h3 {
    font-size: 22px;
    line-height: 1.15;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .period {
    font-size: 13px;
    white-space: normal;
  }

  .bullets {
    padding-left: 18px;
  }
}
```

Note: this removes the old `.item` background/border/padding rules, removes the gradient from `.item h3`, removes the entire `@media print` block (the h3 no longer has a gradient to reset), and tightens the mobile rail width.

The `.item::before` pseudo-element renders the rail and spans all rows of the grid via `grid-row: 1 / -1`. `.header` and `.bullets` are explicitly placed in column 2 so they sit beside the rail rather than below it. No JSX change is required — `WorkExperience.tsx` already wraps the role/period in `.header` and the achievements in `.bullets`.

- [ ] **Step 2: Run the test suite**

Run: `bun test`
Expected: PASS, 126 tests. WorkExperience tests still pass because they assert text content, not visual layout.

- [ ] **Step 3: Type-check and lint**

Run: `bun ts:check && bun lint`
Expected: clean.

- [ ] **Step 4: Format and commit**

Run: `bun prettier`

```bash
git add src/components/WorkExperience.module.css
git commit -m "CJR: replace \`WorkExperience\` item panel with accent rail"
```

---

## Task 6: Visual verification in the browser

**Files:** none modified.

This task confirms the change works in the dev server before pushing. CSS regressions (visual readability, mobile breakpoint, print rendering) are not caught by Vitest.

- [ ] **Step 1: Start the dev server**

Run: `bun dev`
Expected: Vite prints a `Local:` URL (typically `http://localhost:5173`). Leave the server running.

- [ ] **Step 2: Open the URL in a browser and inspect each section**

Check the following:

- Each non-Summary section shows the numbered chip (`01 · Stack`, `02 · Experience`, `03 · Recognition`, `04 · Languages`, `05 · Education`) above the heading.
- Summary has no chip and reads as plain prose.
- Section panels look tinted-dark with a subtle accent edge, not near-transparent.
- The sky still shows through the panels (blurred), so the parallax aesthetic survives.
- Section headings render as a gradient ending toward purple at the right.
- WorkExperience items show a single accent rail down the left edge of each role, with the role title in serif italic (no gradient).
- The role title is NOT inside an inner panel anymore.

- [ ] **Step 3: Verify mobile layout**

Resize the browser to under 700px (or use DevTools device emulation). Check:

- Section padding tightens, heading drops to 19px, chip stays legible.
- WorkExperience items still show the accent rail, role title drops to 22px, header stacks vertically (role on top, period below).

- [ ] **Step 4: Verify PDF export**

Click the "Download CV" button. Open the produced PDF. Check:

- Section panels render as solid dark (no transparent gaps, no blur artifacts).
- Section headings render in solid text color (no missing-gradient fallback issues).
- Numbered chips render legibly.
- Role titles in WorkExperience render in serif italic, solid color.
- Accent rail on items renders.

- [ ] **Step 5: Stop the dev server**

Press Ctrl-C in the terminal running `bun dev`.

- [ ] **Step 6: No commit**

Task 6 only verifies. If any of steps 2 through 4 surface a regression, open a new task to address it.

---

## Task 7: Production build sanity check

**Files:** none modified.

- [ ] **Step 1: Run the production build**

Run: `bun run build`
Expected: builds cleanly, no warnings beyond what shipped at HEAD prior to this work.

- [ ] **Step 2: Done**

If the build is clean, the work is ready for review or merge.

---

## Summary of commits this plan produces

1. ``CJR: add `--panel-overlay` and `--panel-edge` tokens for sections``
2. ``CJR: add `index` and `eyebrow` props to `Section` for numbered chip``
3. ``CJR: refresh `Section` panel with tinted glass and gradient heading``
4. `CJR: wire section numbering through page consumers`
5. ``CJR: replace `WorkExperience` item panel with accent rail``

No commit for Task 6 (visual verification) or Task 7 (build sanity check) because neither changes files.
