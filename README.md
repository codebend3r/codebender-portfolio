# CJ Rivas — Portfolio

> A single-page resume & portfolio for a Senior Frontend Engineer + Architect. Built as a showcase of modern React patterns, with a living, time-of-day sky, a live weather overlay driven by the visitor's location, a native PDF export pipeline, and a full drag-and-drop resume editor with saved variations.

![CJ Rivas portfolio at day](docs/screenshots/hero-day.png)

---

## Features

### Time-of-day sky

The background ambient palette changes based on the visitor's local hour. Four distinct stages, each with hand-tuned palettes, glows, sun position, and cloud tint:

|               Dawn (5–8)               |              Day (8–17)               |              Dusk (17–20)              |               Night (20–5)               |
| :------------------------------------: | :-----------------------------------: | :------------------------------------: | :--------------------------------------: |
| ![dawn](docs/screenshots/sky-dawn.png) | ![day](docs/screenshots/hero-day.png) | ![dusk](docs/screenshots/sky-dusk.png) | ![night](docs/screenshots/sky-night.png) |

- 9 cloud shapes pulled from a single 3×3 PNG sprite sheet (`src/assets/clouds.png`), randomized across two parallax layers.
- Each cloud has an independent drift animation (`@keyframes cloudDrift`) and reacts to page scroll via `requestAnimationFrame` for buttery parallax.
- The sun and moon are also rendered from the same sprite sheet, with per-sky positioning.
- Night swaps the clouds layer for a three-layer parallax `<Starfield />` (160 + 80 + 30 stars, each layer scrolling at a different speed) and a soft glowing moon.

Force a state with `?sky=day|dawn|dusk|night` — handy for screenshots and demos.

### Live weather overlay

On load, the app requests the visitor's geolocation and queries [Open-Meteo](https://open-meteo.com) for the current weather code. Two of the WMO code families trigger an overlay:

|                        Rain                        |                        Snow                        |
| :------------------------------------------------: | :------------------------------------------------: |
| ![rain overlay](docs/screenshots/weather-rain.png) | ![snow overlay](docs/screenshots/weather-snow.png) |

- 140 raindrops / 90 snowflakes, each with randomized position, size, opacity, and animation duration so no two frames look the same.
- All particles are pure CSS animations (`rainFall`, `snowFall`) — no canvas, no JS frame loop, no jank.
- Override with `?weather=rain|snow|none` to preview without waiting on geolocation.

### Sticky weather + clock indicator

A live indicator shows the current local date, time, weather emoji, and temperature — pinned in the header.

![sticky header](docs/screenshots/sticky-header.png)

- The `AppHeader` uses `IntersectionObserver` on a sentinel `<div>` to detect when it sticks to the top of the viewport, then `data-stuck` triggers a compact layout (smaller logo + title, tightened spacing).
- Clock ticks once per minute via `setInterval`, weather fetched once per session.

### Section navigation

A floating nav tracks scroll position via `IntersectionObserver` and highlights the section currently in view, with numbered chips mirroring the sections mounted in `App.tsx`. Clicking a link smooth-scrolls to the section (instant if `prefers-reduced-motion` is set).

### Selected Work showcase

A grid of project cards (browser-chrome framing, screenshot, domain badge, role, period, description, tag pills) linking out to live projects — sourced from the `showcase` array in `resume.json`.

### One-click PDF export

A "Download CV" button generates a single-page PDF entirely client-side using [`@react-pdf/renderer`](https://react-pdf.org): `src/pdf/ResumePDF.tsx` mirrors the on-page layout with a dedicated set of design tokens (`src/pdf/tokens.ts`), and `src/pdf/fonts.ts` embeds Source Serif 4 (regular/italic/semibold/bold) via `Font.register` so the PDF's typography matches the page. `@react-pdf/renderer` and its `fontkit` dependency are dynamically imported (`import("@pdf")`) so they never ship in the main bundle — only users who click download (or generate a PDF from the editor) pay for that chunk.

### Resume editor & variations

![resume editor](docs/screenshots/edit-resume.png)

Visiting `/edit-resume` mounts the same component tree in an editing context (`EditProvider`) instead of the read-only page:

- Every text field becomes an inline, auto-growing `<input>`/`<textarea>` (`EditableText`) that writes straight to the Zustand store via a generic `setPath(path, value)`.
- Lists — skills, achievements, showcase items, tags — get add/remove buttons and drag-to-reorder handles powered by `@dnd-kit`. The drag machinery is lazy-loaded (`SortableListImpl`) so the public-facing page never downloads it.
- A **Variations** side panel lets you fork the base resume into named, independently-editable copies persisted to `localStorage` (Zustand `persist` middleware, `src/state/useVariations.ts`). Switch between "Base (original)" and any saved variation, rename or delete variations, and an unsaved-changes guard (`beforeunload`) warns before you navigate away with a dirty edit.
- "Generate PDF" produces a PDF scoped to whichever variation is currently active, with the filename slugified from the variation's name (e.g. `cj_rivas_backend_leaning.pdf`).

### Data-driven content

The entire resume — name, contact, summary, skills (+ per-skill hover text), work history, awards, languages, education, showcase — is hydrated from a single `src/data/resume.json` file at module load and normalized through `normalizeData()` (which migrates older/legacy data shapes, e.g. a pre-array `contact` object, so saved variations never break after a schema change). Adding a new section is: extend the JSON → add a type → extend the Zustand store → mount a component.

Hover tooltips on each Technical Skills pill come from the `skill_descriptions` array in `resume.json`, kept in parallel with `technical_skills` (and reordered/edited together in the editor).

Each work experience entry also shows a computed, human-readable duration (e.g. "1 year 9 months") derived from its `period` string by `src/utils/experienceDuration.ts`.

---

## Full page

<details>
<summary>Click to expand a full-page screenshot</summary>

![full page](docs/screenshots/full-page.png)

</details>

---

## Tech stack

| Layer               | Choice                                            | Why                                                                                               |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Build / dev**     | Vite 8                                            | Instant HMR, native ESM, fast cold starts                                                         |
| **UI framework**    | React 19 + TypeScript 6                           | `useId`, automatic batching, modern types                                                         |
| **State**           | Zustand 5                                         | Tiny, no boilerplate; resume store seeded from JSON, variations store persisted to `localStorage` |
| **Styling**         | CSS Modules + design tokens                       | Scoped class names, no runtime, readable in DevTools (`Header_logo__a3f2`)                        |
| **PDF export**      | `@react-pdf/renderer`                             | Declarative React → PDF, embedded webfonts, runs entirely client-side, lazy-loaded chunk          |
| **Drag & drop**     | `@dnd-kit/core` + `sortable` + `utilities`        | Accessible reordering in the resume editor; lazy-loaded, absent from the public page              |
| **Webfonts**        | `@fontsource/inter`, `@fontsource/source-serif-4` | Self-hosted, no external font requests; Source Serif 4 double-embedded for PDF output             |
| **Weather data**    | Open-Meteo (free, no key)                         | WMO weather codes via `current_weather`                                                           |
| **Testing**         | Vitest 4 + Testing Library + jsdom                | Component + util tests colocated next to source                                                   |
| **Lint / format**   | ESLint 9 (flat config) + Prettier                 | `@trivago/prettier-plugin-sort-imports` enforces import groups                                    |
| **Type checking**   | `tsc --noEmit`                                    | Runs on every commit                                                                              |
| **Git hooks**       | Husky                                             | `pre-commit`: prettier check → ts:check → lint → test                                             |
| **Package manager** | Bun                                               | `packageManager` field pinned in `package.json`                                                   |
| **Deploy**          | Netlify                                           | Project: [`codebend3r`](https://app.netlify.com/projects/codebend3r)                              |

---

## Architecture

```
src/
├── App.tsx                  ← Composes Sky + Weather + SectionNav + AppHeader + read-only sections
├── Entry.tsx                ← React root; routes "/edit-resume" → <EditResumeApp />, else <App />
├── components/              ← Flat directory — each component is a .tsx + .module.css (+ .test.tsx) triple
│   ├── AppHeader.tsx        ← Sticky-on-scroll wrapper; mounts <Header /> + <WeatherClock /> + Download CV button
│   ├── Header.tsx           ← Identity + contact line (email, phone, location, GitHub, LinkedIn)
│   ├── SectionNav.tsx       ← Floating nav; highlights active section via IntersectionObserver
│   ├── Sky.tsx              ← Time-of-day clouds, sun, moon (PNG sprite); swaps to <Starfield /> at night
│   ├── Starfield.tsx        ← Parallax 3-layer night sky (160 + 80 + 30 stars)
│   ├── Weather.tsx          ← Rain (140 drops) / snow (90 flakes) overlay; pure CSS animation
│   ├── WeatherClock.tsx     ← Live clock + weather emoji + temperature (ticks every minute)
│   ├── Section.tsx          ← Shared <section> + <h2> wrapper used by all content sections
│   ├── Summary.tsx  TechnicalSkills.tsx  WorkExperience.tsx  Showcase.tsx
│   ├── Awards.tsx  Languages.tsx  Education.tsx  Footer.tsx
├── edit/                    ← Resume editor, mounted only at /edit-resume
│   ├── EditResumeApp.tsx    ← Renders the resume tree inside EditProvider; owns variation/session state
│   ├── EditContext.tsx      ← `editing` flag + `markDirty()`, consumed by every section component
│   ├── EditableText.tsx     ← Inline auto-growing input/textarea bound to a store path
│   ├── VariationsPanel.tsx  ← Create/rename/delete/select variations; Save + Generate PDF actions
│   ├── RenameModal.tsx      ← Portal-rendered modal for naming/renaming a variation
│   ├── SortableList.tsx     ← Public wrapper; lazy-loads dnd-kit only when editing
│   ├── SortableListImpl.tsx ← Actual @dnd-kit sortable context (lazy chunk)
│   └── sortableContext.ts   ← Context bridging the lazy dnd-kit implementation into SortableItem
├── pdf/                     ← @react-pdf/renderer document, lazy-loaded via `import("@pdf")`
│   ├── generatePdf.tsx      ← generateResumePdf(data) → Blob; downloadBlob() triggers the browser download
│   ├── ResumePDF.tsx        ← React-PDF document mirroring the on-page resume layout
│   ├── fonts.ts             ← Registers Source Serif 4 weights/styles for @react-pdf/renderer
│   ├── styles.ts            ← @react-pdf/renderer StyleSheet definitions
│   ├── tokens.ts             ← PDF-specific design tokens (fonts, spacing, colors)
│   └── index.ts              ← Barrel re-exporting generatePdf's public API
├── data/
│   ├── resume.json          ← Single source of truth for resume content (incl. showcase, skill_descriptions)
│   └── CJ Rivas - Senior Frontend Engineer.pdf  ← Pre-rendered CV (also produced live via Download CV)
├── state/
│   ├── useStore.ts          ← Zustand store, seeded from resume.json; setPath/reorder + add/remove actions
│   └── useVariations.ts     ← Zustand store (persisted to localStorage) for named resume variations
├── styles/
│   ├── tokens.css           ← :root CSS custom properties (--bg, --accent, --cloud-drift, …)
│   ├── keyframes.css         ← cloudDrift, rainFall, snowFall, glowPulse
│   └── global.css            ← resets + @media print rules
├── sky.ts                    ← getCurrentSky(), applySky(), URL override parsing
├── weather.ts                ← Open-Meteo fetcher, WMO code mapping, URL override parsing
├── utils/
│   ├── dom-utils.ts           ← DOM helpers
│   ├── normalizeData.ts       ← Migrates legacy resume/variation data shapes on load
│   ├── setPath.ts              ← Generic immutable nested-path update used by the editor
│   └── experienceDuration.ts   ← Formats a work-experience period into "N years M months"
├── types/global.d.ts          ← Ambient types: Data, Experience, Award, Language, Education, Showcase, Variation, ResumeStore
└── test/                       ← Vitest setup
```

### Path aliases

Configured in **both** `vite.config.ts` (runtime) and `tsconfig.json` (types) — they must stay in sync.

`@App`, `@app`, `@assets/*`, `@components/*`, `@data/*`, `@edit/*`, `@pdf/*`, `@sky`, `@state/*`, `@styles/*`, `@utils/*`, `@weather`

---

## Getting started

```bash
bun install
bun dev          # http://localhost:4242
```

### Demo URLs

| URL                                             | Effect                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `http://localhost:4242/?sky=night`              | Force night sky + starfield                                                                 |
| `http://localhost:4242/?sky=dawn`               | Force dawn palette                                                                          |
| `http://localhost:4242/?weather=rain`           | Force rain overlay                                                                          |
| `http://localhost:4242/?weather=snow`           | Force snow overlay                                                                          |
| `http://localhost:4242/?sky=night&weather=snow` | Combine: snowy night                                                                        |
| `http://localhost:4242/edit-resume`             | Open the resume editor                                                                      |
| `http://localhost:4242/angular-version/`        | Angular recreation of the homepage (public, React-free; same `?sky=`/`?weather=` overrides) |

---

## Scripts

| Script                                              | What it does                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `bun dev`                                           | Vite dev server on port `4242`                                                          |
| `bun run build`                                     | Production build (note: `bun build` invokes Bun's bundler — always use `bun run build`) |
| `bun preview`                                       | Preview the built output                                                                |
| `bun lint` / `bun lint:fix`                         | ESLint (flat config)                                                                    |
| `bun prettier` / `bun prettier:check`               | Prettier write / check                                                                  |
| `bun ts:check`                                      | TypeScript type check (no emit)                                                         |
| `bun test` / `bun test:watch` / `bun test:coverage` | Vitest                                                                                  |
| `bun system-check`                                  | `prettier:check` → `ts:check` → `lint` → `test` → `build`                               |

---

## Git hooks

Husky runs on every commit and push:

- **pre-commit** — `prettier:check` → `ts:check` → `lint` → `test`. The commit fails if any step fails. Because `prettier:check` does not write, run `bun prettier` yourself first if formatting is off.
- **pre-push** — `bun run build`, then prints the last 10 commits as a sanity check. Push fails if the build fails, so deps must be installed (`bun install`) before pushing.

---

## Code style

- No semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`.
- Import order is enforced by `@trivago/prettier-plugin-sort-imports` with custom groups (react first → third-party → `@components`/`@data`/`@edit`/`@pdf`/`@state`/`@styles` → relative). Groups are blank-line separated.
- ESLint enforces `@typescript-eslint/consistent-type-imports` — type-only imports must use `import type`.
- `_`-prefixed unused vars are ignored.
