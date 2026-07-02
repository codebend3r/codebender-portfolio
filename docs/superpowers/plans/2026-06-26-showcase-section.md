# Selected Work Showcase Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven "Selected Work" section that showcases four live websites CJ built, each with a committed screenshot, role/dates, description, and tech tags, styled cohesively with the existing dark mono/terminal aesthetic.

**Architecture:** Follows the project's data-driven pattern: a `showcase` array in `resume.json` flows through the Zustand store into a new `Showcase` component that reuses the existing `Section` chrome. Screenshots are captured once by a committed headless-Chrome script and served as static assets from `public/showcase/`.

**Tech Stack:** Vite + React 19 + TypeScript, Zustand, plain CSS Modules, Vitest + Testing Library, `bun` as package manager. Screenshot capture via locally installed Google Chrome + macOS `sips`.

## Global Constraints

- Package manager is `bun`; build is `bun run build` (never `bun build`).
- Commit subjects MUST start with `CJR: ` (lowercase imperative after it). No agent attribution anywhere. Backtick all code identifiers/paths. Bullets with `-`, no trailing periods. (See `codebender-portfolio-commit-format` skill.)
- Prettier: no semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`. Type-only imports use `import type`. Import order auto-sorted by `bun prettier`.
- Spacing convention: no CSS `margin` for separation; use a grid parent with `gap`. Narrow exceptions: `margin: 0 auto` centering, `margin: 0` resets.
- Colors/fonts only from `src/styles/tokens.css` custom properties; no new tokens or hard-coded colors.
- Pre-commit hook runs `ts:check` -> `prettier` (write) -> `lint` -> `build`; if prettier rewrites files, re-stage and recommit.
- Path aliases (`@components/*`, `@data/*`, `@state/*`) are already configured; no alias changes needed.

---

## File Structure

- `src/data/resume.json` — add top-level `showcase` array (4 entries).
- `src/types/global.d.ts` — add `Showcase` type; add `showcase` to `Data`.
- `src/state/useStore.ts` — no change (store spreads `...data`, so `showcase` flows through automatically once `Data` includes it).
- `src/components/Showcase.tsx` — new component, reads `showcase` slice, renders card grid inside `Section`.
- `src/components/Showcase.module.css` — new colocated styles.
- `src/components/Showcase.test.tsx` — new component test.
- `src/App.tsx` — mount `<Showcase index={3} eyebrow="Selected Work" />`, renumber subgrid to 4/5/6.
- `scripts/capture-showcase.mjs` — new committed capture script.
- `public/showcase/*.png` — 4 committed screenshots (`qp-briefing.png`, `homegenius.png`, `globe-and-mail.png`, `toronto-star.png`).

Project slugs and URLs (used by both data and script):

| Slug             | URL                              | Name                   |
| ---------------- | -------------------------------- | ---------------------- |
| `qp-briefing`    | https://www.qpbriefing.com       | QP Briefing            |
| `homegenius`     | https://homegeniusrealestate.com | homegenius Real Estate |
| `globe-and-mail` | https://www.theglobeandmail.com  | The Globe and Mail     |
| `toronto-star`   | https://www.thestar.com          | Toronto Star           |

---

## Task 1: Showcase data + types

**Files:**

- Modify: `src/data/resume.json` (add top-level `showcase` array)
- Modify: `src/types/global.d.ts` (add `Showcase` type, extend `Data`)
- Test: `src/data/showcase.test.ts` (new)

**Interfaces:**

- Consumes: nothing.
- Produces: a `Showcase` ambient type and a `resume.json` `showcase: Showcase[]` array with exactly 4 entries. Each entry has keys `name`, `domain`, `url`, `role`, `period`, `description`, `image`, `tags` (string array). Consumed by Task 2 (component) and Task 4 (script slugs mirror `image` filenames).

- [ ] **Step 1: Write the failing test**

Create `src/data/showcase.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

describe("resume.json showcase data", () => {
  it("has four showcase entries", () => {
    expect(resume.showcase).toHaveLength(4)
  })

  it("each entry has the required fields populated", () => {
    for (const item of resume.showcase) {
      expect(item.name).toBeTruthy()
      expect(item.domain).toBeTruthy()
      expect(item.url).toMatch(/^https:\/\//)
      expect(item.role).toBeTruthy()
      expect(item.period).toBeTruthy()
      expect(item.description.length).toBeGreaterThan(20)
      expect(item.image).toMatch(/^\/showcase\/.+\.png$/)
      expect(item.tags.length).toBeGreaterThanOrEqual(2)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/showcase.test.ts`
Expected: FAIL (`resume.showcase` is `undefined`, `toHaveLength` throws).

- [ ] **Step 3: Add the `showcase` array to `resume.json`**

Add this top-level key to `src/data/resume.json` (insert after the `education` array, before the closing brace; remember to add a comma after the `education` array):

```json
  "showcase": [
    {
      "name": "QP Briefing",
      "domain": "qpbriefing.com",
      "url": "https://www.qpbriefing.com",
      "role": "Fullstack Engineer",
      "period": "2023 - Present",
      "description": "Sole full-stack developer for the QP Briefing news site on Next.js, React, Prisma, and Sanity CMS; owned the backend, CI/CD, and infrastructure.",
      "image": "/showcase/qp-briefing.png",
      "tags": ["Next.js", "React", "Prisma", "Sanity"]
    },
    {
      "name": "homegenius Real Estate",
      "domain": "homegeniusrealestate.com",
      "url": "https://homegeniusrealestate.com",
      "role": "Senior Frontend Engineer + Architect",
      "period": "2022 - 2023",
      "description": "Front-end lead architect who built the real estate platform from scratch to production in under a year with Next.js, TypeScript, GraphQL, and Nest.js, backed by a Storybook design system.",
      "image": "/showcase/homegenius.png",
      "tags": ["Next.js", "TypeScript", "GraphQL", "Storybook"]
    },
    {
      "name": "The Globe and Mail",
      "domain": "theglobeandmail.com",
      "url": "https://www.theglobeandmail.com",
      "role": "Senior Frontend Engineer",
      "period": "2024 - 2026",
      "description": "Built interactive React components and a Storybook design system integrated with a proprietary CMS, boosting reader engagement.",
      "image": "/showcase/globe-and-mail.png",
      "tags": ["React", "Storybook", "Design System"]
    },
    {
      "name": "Toronto Star",
      "domain": "thestar.com",
      "url": "https://www.thestar.com",
      "role": "Frontend Team Lead",
      "period": "2018 - 2019",
      "description": "Frontend team lead on thestar.com who led a new responsive main menu in React and owned code review, E2E testing, and Sentry error monitoring.",
      "image": "/showcase/toronto-star.png",
      "tags": ["React", "E2E Testing", "Sentry"]
    }
  ]
```

- [ ] **Step 4: Add the `Showcase` type and extend `Data` in `src/types/global.d.ts`**

Add this type near the other types (e.g. after `Experience`):

```ts
type Showcase = {
  name: string
  domain: string
  url: string
  role: string
  period: string
  description: string
  image: string
  tags: string[]
}
```

And add this line inside the `Data` type, after `education: Education[]`:

```ts
  showcase: Showcase[]
```

- [ ] **Step 5: Run test + type check to verify pass**

Run: `bun test src/data/showcase.test.ts && bun ts:check`
Expected: test PASS (4 entries, fields valid); `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
bun prettier
git add src/data/resume.json src/types/global.d.ts src/data/showcase.test.ts
git commit -m "$(cat <<'EOF'
CJR: add `showcase` data and `Showcase` type

- four featured projects in `resume.json`
- `Showcase` type added to `global.d.ts`, extends `Data`
- `showcase.test.ts` asserts entry count and field shape
EOF
)"
```

---

## Task 2: Showcase component, styles, and test

**Files:**

- Create: `src/components/Showcase.tsx`
- Create: `src/components/Showcase.module.css`
- Test: `src/components/Showcase.test.tsx`

**Interfaces:**

- Consumes: `Showcase` type and `useStore().showcase` from Task 1; `Section` from `@components/Section` (props `title`, `index?`, `eyebrow?`, `children`).
- Produces: `export function Showcase({ index, eyebrow }: { index?: number; eyebrow?: string })`. Renders a `Section` titled `"Selected Work"`. Each project renders an `<a>` (role `link`) whose accessible name includes the project `name`, links to `url`, with `target="_blank"` and `rel="noopener noreferrer"`. Consumed by Task 3 (`App.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/components/Showcase.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Showcase } from "@components/Showcase"

import resume from "@data/resume.json"

describe("Showcase", () => {
  it("renders inside a Selected Work section", () => {
    render(<Showcase />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Selected Work" })
    ).toBeInTheDocument()
  })

  it("renders one linked card per showcase item", () => {
    render(<Showcase />)
    for (const item of resume.showcase) {
      const link = screen.getByRole("link", { name: new RegExp(item.name) })
      expect(link).toHaveAttribute("href", item.url)
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))
    }
  })

  it("renders period, domain, description, and tags for the first card", () => {
    render(<Showcase />)
    const first = resume.showcase[0]
    const card = screen.getByRole("link", { name: new RegExp(first.name) })
    expect(within(card).getByText(first.period)).toBeInTheDocument()
    expect(within(card).getByText(first.domain)).toBeInTheDocument()
    expect(within(card).getByText(first.description)).toBeInTheDocument()
    for (const tag of first.tags) {
      expect(within(card).getByText(tag)).toBeInTheDocument()
    }
  })

  it("gives each screenshot a non-empty alt", () => {
    render(<Showcase />)
    const first = resume.showcase[0]
    expect(
      screen.getByRole("img", { name: `${first.name} website` })
    ).toBeInTheDocument()
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<Showcase index={3} eyebrow="Selected Work" />)
    expect(screen.getByText("03 · Selected Work")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/Showcase.test.tsx`
Expected: FAIL (`Showcase` module not found / not exported).

- [ ] **Step 3: Write the component**

Create `src/components/Showcase.tsx`:

```tsx
import { Section } from "@components/Section"
import styles from "@components/Showcase.module.css"

import { useStore } from "@state/useStore"

export function Showcase({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { showcase } = useStore()

  return (
    <Section title="Selected Work" index={index} eyebrow={eyebrow}>
      <ul className={styles.grid}>
        {showcase.map((item) => (
          <li key={item.url}>
            <a
              className={styles.card}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.frame} aria-hidden>
                <span className={styles.dots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </span>
                <span className={styles.domain}>{item.domain}</span>
              </span>
              <span className={styles.shot}>
                <img
                  src={item.image}
                  alt={`${item.name} website`}
                  loading="lazy"
                />
              </span>
              <span className={styles.body}>
                <span className={styles.titleRow}>
                  <h3 className={styles.name}>{item.name}</h3>
                  <span className={styles.period}>{item.period}</span>
                </span>
                <span className={styles.role}>{item.role}</span>
                <span className={styles.description}>{item.description}</span>
                <span className={styles.tags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
```

Note: `domain` renders as visible text (inside an `aria-hidden` frame, but the test queries by text which still finds it in the DOM). The card's accessible name derives from the heading + body text, which includes `name`, so `getByRole("link", { name: /.../ })` matches.

- [ ] **Step 4: Write the styles**

Create `src/components/Showcase.module.css`:

```css
.grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 22px;
}

.card {
  display: grid;
  grid-template-rows: auto auto 1fr;
  height: 100%;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--panel-edge);
  border-radius: 14px;
  overflow: hidden;
  background: var(--panel-overlay);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.card:hover,
.card:focus-visible {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow:
    0 14px 36px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(122, 162, 247, 0.35);
  outline: none;
}

.frame {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.dots {
  display: inline-flex;
  gap: 6px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--border);
}

.dot:nth-child(1) {
  background: #ff5f57;
}

.dot:nth-child(2) {
  background: #febc2e;
}

.dot:nth-child(3) {
  background: #28c840;
}

.domain {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.shot {
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--bg);
}

.shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  transition: transform 0.4s ease;
}

.card:hover .shot img,
.card:focus-visible .shot img {
  transform: scale(1.04);
}

.body {
  display: grid;
  gap: 10px;
  padding: 16px 18px 18px;
  align-content: start;
}

.titleRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.name {
  margin: 0;
  font-family: var(--font-role);
  font-style: italic;
  font-weight: 400;
  font-size: 24px;
  line-height: 1.1;
  color: var(--text);
}

.period {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
  color: var(--accent2);
}

.role {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.description {
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 3px 8px;
  border: 1px solid rgba(122, 162, 247, 0.35);
  border-radius: 999px;
  background: rgba(122, 162, 247, 0.08);
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .name {
    font-size: 20px;
  }
}

@media print {
  .card {
    background: var(--panel);
    box-shadow: none;
  }

  .shot img {
    transform: none;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test src/components/Showcase.test.tsx`
Expected: PASS (all 5 specs green).

- [ ] **Step 6: Commit**

```bash
bun prettier
git add src/components/Showcase.tsx src/components/Showcase.module.css src/components/Showcase.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add `Showcase` selected-work section component

- card grid reuses `Section` chrome and design tokens
- faux browser frame with domain in `--font-mono`
- screenshot, role, period, description, and tag pills per card
- whole card links to the live site in a new tab
EOF
)"
```

---

## Task 3: Mount the section in `App.tsx`

**Files:**

- Modify: `src/App.tsx` (import + mount `Showcase`, renumber subgrid)

**Interfaces:**

- Consumes: `Showcase` from `@components/Showcase` (Task 2).
- Produces: rendered page with `03 · Selected Work` between Work Experience and the Awards/Languages/Education subgrid; subgrid chips renumbered to 04/05/06.

- [ ] **Step 1: Add the import**

In `src/App.tsx`, add to the `@components` import group (alphabetical order; `bun prettier` will sort, but place it sensibly):

```tsx
import { Showcase } from "@components/Showcase"
```

- [ ] **Step 2: Mount the component and renumber the subgrid**

Replace the `<main>` block body so it reads:

```tsx
<main className={styles.main}>
  <Summary />
  <TechnicalSkills index={1} eyebrow="Stack" />
  <WorkExperience index={2} eyebrow="Experience" />
  <Showcase index={3} eyebrow="Selected Work" />

  <div className={styles.subgrid}>
    <Awards index={4} eyebrow="Recognition" />
    <Languages index={5} eyebrow="Languages" />
    <Education index={6} eyebrow="Education" />
  </div>
</main>
```

- [ ] **Step 3: Verify the full suite and build pass**

Run: `bun test && bun run build`
Expected: all tests PASS; production build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
bun prettier
git add src/App.tsx
git commit -m "$(cat <<'EOF'
CJR: mount `Showcase` as section 03 in `App.tsx`

- insert `Showcase` after `WorkExperience`
- renumber `Awards`/`Languages`/`Education` to 04/05/06
EOF
)"
```

---

## Task 4: Screenshot capture script + committed assets

**Files:**

- Create: `scripts/capture-showcase.mjs`
- Create: `public/showcase/qp-briefing.png`, `homegenius.png`, `globe-and-mail.png`, `toronto-star.png` (generated by the script)

**Interfaces:**

- Consumes: the slug/url table (mirrors Task 1 `image` filenames).
- Produces: four committed PNGs at the paths the `showcase` data references; a re-runnable `node scripts/capture-showcase.mjs`.

- [ ] **Step 1: Write the capture script**

Create `scripts/capture-showcase.mjs`:

```js
import { execFileSync } from "node:child_process"
import { mkdirSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const TARGETS = [
  { slug: "qp-briefing", url: "https://www.qpbriefing.com" },
  { slug: "homegenius", url: "https://homegeniusrealestate.com" },
  { slug: "globe-and-mail", url: "https://www.theglobeandmail.com" },
  { slug: "toronto-star", url: "https://www.thestar.com" },
]

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "public", "showcase")
mkdirSync(outDir, { recursive: true })

for (const { slug, url } of TARGETS) {
  const raw = join(outDir, `${slug}.raw.png`)
  const final = join(outDir, `${slug}.png`)
  console.log(`capturing ${slug} <- ${url}`)
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--window-size=1440,900",
      "--virtual-time-budget=8000",
      "--default-background-color=0",
      `--screenshot=${raw}`,
      url,
    ],
    { stdio: "inherit", timeout: 60000 }
  )
  // downscale to a consistent 1200px width
  execFileSync("sips", ["--resampleWidth", "1200", raw, "--out", final], {
    stdio: "inherit",
  })
  rmSync(raw)
}

console.log("done")
```

- [ ] **Step 2: Run the script to generate screenshots**

Run: `node scripts/capture-showcase.mjs`
Expected: console logs four `capturing ...` lines and `done`; `public/showcase/` contains four `.png` files.

- [ ] **Step 3: Verify the assets are valid images**

Run: `file public/showcase/*.png`
Expected: each reported as `PNG image data, 1200 x ...`.

- [ ] **Step 4: Visually inspect each capture**

Open `public/showcase/*.png`. Confirm each shows the live site (not an error/parked page). If any site rendered a paywall, that is acceptable. If a capture is a parked/redesigned page that misrepresents the work (watch `homegenius` especially), STOP and report it to the user rather than committing a misleading thumbnail.

- [ ] **Step 5: Run the app and confirm the section renders with images**

Run: `bun dev`, open the page, scroll to `03 · Selected Work`. Confirm cards show screenshots, hover lifts the card and zooms the image, and clicking opens the live site in a new tab.

- [ ] **Step 6: Commit script + assets**

```bash
bun prettier
git add scripts/capture-showcase.mjs public/showcase
git commit -m "$(cat <<'EOF'
CJR: add `capture-showcase.mjs` and showcase screenshots

- headless Chrome captures each live site, `sips` downscales to 1200px
- commit `public/showcase/` PNGs referenced by `resume.json`
EOF
)"
```

---

## Task 5: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full system check**

Run: `bun system-check`
Expected: `prettier:check`, `lint`, `test`, and `build` all pass.

- [ ] **Step 2: Fix and recommit if anything fails**

If `prettier:check` flags files, run `bun prettier`, re-stage, and amend/commit per the commit-format rules. Re-run `bun system-check` until green.

---

## Self-Review

**Spec coverage:**

- Data model (showcase array, `Showcase` type, `Data` extension) -> Task 1.
- Store flows `showcase` -> covered automatically by `...data` spread (noted in File Structure); `Data` type extension in Task 1 makes it type-safe.
- Component with faux browser frame, screenshot, role/period/description/tags, hover -> Task 2.
- Placement as section 03 + renumbering -> Task 3.
- Screenshot capture script + committed assets -> Task 4.
- Testing (count, links, alt, chip) -> Task 2 test; data shape -> Task 1 test.
- Styling cohesion (tokens only, no margins, mobile + print media queries) -> Task 2 CSS.
- Definition of done (`bun system-check` green) -> Task 5.

**Placeholder scan:** No TBD/TODO; all code blocks complete.

**Type consistency:** `Showcase` fields (`name`, `domain`, `url`, `role`, `period`, `description`, `image`, `tags`) are identical across Task 1 type, Task 1 data, Task 2 component, and Task 2 test. Slugs in Task 4 match `image` filenames in Task 1 data.
