# CJ Rivas — Portfolio

> A single-page resume & portfolio for a Senior Frontend Engineer + Architect. Built as a showcase of modern React patterns, with a living, time-of-day sky and a live weather overlay driven by the visitor's location.

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

### One-click PDF export

A "Download CV" button rasterizes the resume to a single, full-height PDF — using `html2pdf.js` with a custom `waitForAssets` utility that resolves once every image and webfont is decoded, so the PDF never captures half-loaded state.

### Data-driven content

The entire resume — name, contact, summary, skills, work history, awards, languages, education — is hydrated from a single `src/data/resume.json` file at module load. Adding a new section is: extend the JSON → add a type → extend the Zustand store → mount a component. No mutations, no async fetch, no setters.

Hover tooltips on each Technical Skills pill are sourced from `src/data/skillDescriptions.ts` — a separate keyed lookup so the resume JSON stays focused on the skill list itself.

---

## Full page

<details>
<summary>Click to expand a full-page screenshot</summary>

![full page](docs/screenshots/full-page.png)

</details>

---

## Tech stack

| Layer               | Choice                             | Why                                                                        |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| **Build / dev**     | Vite 8                             | Instant HMR, native ESM, fast cold starts                                  |
| **UI framework**    | React 19 + TypeScript 6            | `useId`, automatic batching, modern types                                  |
| **State**           | Zustand 5                          | Tiny, no boilerplate, store seeded from JSON at module load                |
| **Styling**         | CSS Modules + design tokens        | Scoped class names, no runtime, readable in DevTools (`Header_logo__a3f2`) |
| **PDF export**      | `html2pdf.js`                      | DOM → canvas → jsPDF pipeline; runs entirely client-side                   |
| **Weather data**    | Open-Meteo (free, no key)          | WMO weather codes via `current_weather`                                    |
| **Testing**         | Vitest 4 + Testing Library + jsdom | Component + util tests colocated next to source                            |
| **Lint / format**   | ESLint 9 (flat config) + Prettier  | `@trivago/prettier-plugin-sort-imports` enforces import groups             |
| **Type checking**   | `tsc --noEmit`                     | Runs on every commit                                                       |
| **Git hooks**       | Husky                              | `pre-commit`: ts:check → prettier → lint → build                           |
| **Package manager** | Bun                                | `packageManager` field pinned in `package.json`                            |
| **Deploy**          | Netlify                            | Project: [`codebend3r`](https://app.netlify.com/projects/codebend3r)       |

---

## Architecture

```
src/
├── App.tsx                  ← Composes Sky + Weather + AppHeader + sections; owns PDF download flow
├── Entry.tsx                ← React root, mounts global styles + applies sky palette
├── components/              ← Flat directory — each component is a .tsx + .module.css + .test.tsx triple
│   ├── AppHeader.tsx        ← Sticky-on-scroll wrapper; mounts <Header /> + <WeatherClock /> + Download CV button
│   ├── Header.tsx           ← Identity + contact line (email, phone, location, GitHub, LinkedIn)
│   ├── Sky.tsx              ← Time-of-day clouds, sun, moon (PNG sprite); swaps to <Starfield /> at night
│   ├── Starfield.tsx        ← Parallax 3-layer night sky (160 + 80 + 30 stars)
│   ├── Weather.tsx          ← Rain (140 drops) / snow (90 flakes) overlay; pure CSS animation
│   ├── WeatherClock.tsx     ← Live clock + weather emoji + temperature (ticks every minute)
│   ├── Section.tsx          ← Shared <section> + <h2> wrapper used by all content sections
│   ├── Summary.tsx  TechnicalSkills.tsx  WorkExperience.tsx
│   ├── Awards.tsx  Languages.tsx  Education.tsx  Footer.tsx
├── data/
│   ├── resume.json          ← Single source of truth for resume content
│   ├── skillDescriptions.ts ← Per-skill tooltip copy keyed by skill name
│   └── CJ Rivas - Senior Frontend Engineer.pdf  ← Pre-rendered CV (also produced live via Download CV)
├── state/useStore.ts        ← Zustand store, seeded from resume.json at module init
├── styles/
│   ├── tokens.css           ← :root CSS custom properties (--bg, --accent, --cloud-drift, …)
│   ├── keyframes.css        ← cloudDrift, rainFall, snowFall, glowPulse
│   └── global.css           ← resets + @media print rules for PDF export
├── sky.ts                   ← getCurrentSky(), applySky(), URL override parsing
├── weather.ts               ← Open-Meteo fetcher, WMO code mapping, URL override parsing
├── utils/
│   ├── dom-utils.ts         ← DOM helpers
│   └── print-utils.ts       ← waitForAssets() — gates PDF capture on image/font load
├── types/global.d.ts        ← Ambient types: Experience, Award, Language, Education, Data
└── test/                    ← Vitest setup
```

### Path aliases

Configured in **both** `vite.config.ts` (runtime) and `tsconfig.json` (types) — they must stay in sync.

`@App`, `@app`, `@assets/*`, `@components/*`, `@data/*`, `@sky`, `@state/*`, `@styles/*`, `@utils/*`, `@weather`

---

## Getting started

```bash
bun install
bun dev          # http://localhost:4242
```

### Demo URLs

| URL                                             | Effect                      |
| ----------------------------------------------- | --------------------------- |
| `http://localhost:4242/?sky=night`              | Force night sky + starfield |
| `http://localhost:4242/?sky=dawn`               | Force dawn palette          |
| `http://localhost:4242/?weather=rain`           | Force rain overlay          |
| `http://localhost:4242/?weather=snow`           | Force snow overlay          |
| `http://localhost:4242/?sky=night&weather=snow` | Combine: snowy night        |

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
| `bun system-check`                                  | `prettier:check` → `lint` → `test` → `build`                                            |

---

## Git hooks

Husky runs on every commit and push:

- **pre-commit** — `ts:check` → `prettier:check` → `lint` → `test` → `build`. The commit fails if any step fails. Because `prettier:check` does not write, you need to run `bun prettier` yourself before committing if formatting is off.
- **pre-push** — `bun run build`, then prints the last 10 commits as a sanity check. Push fails if the build fails, so deps must be installed (`bun install`) before pushing.

---

## Code style

- No semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`.
- Import order is enforced by `@trivago/prettier-plugin-sort-imports` with custom groups (react first → third-party → `@components`/`@data`/`@state`/`@styles` → relative). Groups are blank-line separated.
- ESLint enforces `@typescript-eslint/consistent-type-imports` — type-only imports must use `import type`.
- `_`-prefixed unused vars are ignored.
