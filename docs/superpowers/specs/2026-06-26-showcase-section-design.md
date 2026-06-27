# Showcase section design

Date: 2026-06-26
Branch: `showcase-section`

## Goal

Add a "Selected Work" section to the single-page portfolio that showcases live
websites CJ has worked on. Each entry shows a real screenshot of the live site,
the role and dates, a short description of the work, and the tech used. The
section must look like a professional UI designer built it while staying
cohesive with the existing dark, mono/terminal aesthetic.

## Scope

### Featured projects (4)

Selected with the user. iPolitics was deliberately excluded.

| Name                   | Domain                   | Role                                 | Period         |
| ---------------------- | ------------------------ | ------------------------------------ | -------------- |
| QP Briefing            | qpbriefing.com           | Fullstack Engineer                   | 2023 - Present |
| homegenius Real Estate | homegeniusrealestate.com | Senior Frontend Engineer + Architect | 2022 - 2023    |
| The Globe and Mail     | theglobeandmail.com      | Senior Frontend Engineer             | 2024 - 2026    |
| Toronto Star           | thestar.com              | Frontend Team Lead                   | 2018 - 2019    |

Descriptions are derived from the matching `work_experience` achievements in
`resume.json`, condensed to one or two sentences each.

### Out of scope

- iPolitics, theScore, Kobo (not selected).
- No CMS/runtime fetching of screenshots; assets are captured once and committed.
- No new design tokens or colors; reuse existing `tokens.css` variables.

## Architecture

The portfolio is fully data-driven from `src/data/resume.json` through a Zustand
store. This feature follows the documented "adding a new resume section" path:
extend `resume.json` -> add a type -> extend `StoreState` -> create a component
-> mount in `App.tsx`.

### 1. Data model

Add a `showcase` array to `src/data/resume.json`. Each entry:

```jsonc
{
  "name": "QP Briefing",
  "domain": "qpbriefing.com",
  "url": "https://www.qpbriefing.com",
  "role": "Fullstack Engineer",
  "period": "2023 - Present",
  "description": "Sole full-stack developer for the QP Briefing news site on Next.js, React, Prisma, and Sanity CMS; owned the backend, CI/CD, and infrastructure.",
  "image": "/showcase/qp-briefing.png",
  "tags": ["Next.js", "React", "Prisma", "Sanity"],
}
```

- `image` is an absolute path served from `public/showcase/`. Same-origin so the
  existing `html2pdf` export (which uses `useCORS`) keeps working.
- `domain` is shown in the faux browser bar; `url` is the link target.

Add the ambient type to `src/types/global.d.ts`:

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

`Data` gains `showcase: Showcase[]`. `StoreState` in `src/state/useStore.ts`
gains `showcase` seeded from `resume.json` like every other slice.

### 2. Component: `Showcase.tsx`

`src/components/Showcase.tsx` reads `showcase` from the store and renders a
`Section` (reusing the existing chip/eyebrow pattern) titled "Selected Work".

Inside, a responsive card grid:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 22px;
}
```

Each card is a single `<a href={url} target="_blank" rel="noopener noreferrer">`
structured as:

1. **Faux browser frame** (top bar): three traffic-light dots plus the `domain`
   in `--font-mono`. This motif ties into the site's terminal/mono aesthetic so
   it reads as intentional design.
2. **Screenshot**: the `image`, `loading="lazy"`, fixed aspect ratio, object-fit
   cover, with an `alt` of `"{name} website"`.
3. **Body**: project `name` in `--font-role` italic (matching the `h3` style used
   in `WorkExperience`), `period` in mono `--accent2`, the `description`, and
   `tags` rendered as accent pills.

Hover state: subtle lift (`translateY`), an `--accent` border glow, and a slow
image zoom (`transform: scale`) on the screenshot only. All transitions use
existing tokens; no new colors.

Spacing follows the project convention: grid + `gap`, no margins (heading margins
zeroed, spacing owned by parent grids).

### 3. Placement in `App.tsx`

Insert `<Showcase index={3} eyebrow="Selected Work" />` immediately after
`<WorkExperience index={2} ... />`. Renumber the subgrid sections to
`Awards index={4}`, `Languages index={5}`, `Education index={6}`. This keeps the
numbered-chip ordering intact and puts visual proof high on the page.

### 4. Screenshot capture script

`scripts/capture-showcase.mjs`, runnable and committed, drives the locally
installed Google Chrome headless once per URL:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --hide-scrollbars --window-size=1440,900 \
  --virtual-time-budget=8000 --screenshot=<tmp>.png <url>
```

`--virtual-time-budget` lets each page run JS / settle before the shot. Each
capture is then downscaled with macOS `sips` to a consistent width (1200px) and
written to `public/showcase/<slug>.png`. The script maps slug -> url from a small
list that mirrors the `showcase` data.

Notes:

- Paywalled sites (Globe and Mail, QP Briefing) capture their public homepage /
  paywall view, which is acceptable.
- homegeniusrealestate.com / older sites capture whatever is currently live; if a
  capture looks like a parked or redesigned page, flag it to the user rather than
  shipping a misleading thumbnail.
- The script is for regeneration; committed PNGs are the source of truth at runtime.

### 5. Testing

`src/components/Showcase.test.tsx` mirrors the existing component tests
(`WorkExperience.test.tsx` style):

- Renders one card per `showcase` entry.
- Each card links to the correct `url` and renders `name`, `period`, and tags.
- Screenshot `img` has a non-empty `alt`.

## Styling cohesion checklist

- Colors only from `tokens.css` (`--accent`, `--accent2`, `--panel-overlay`,
  `--panel-edge`, `--muted`, `--text`).
- Fonts: `--font-role` (italic project name), `--font-mono` (domain, period,
  tags), `--font-body` (description).
- Reuse `Section` chrome (panel, border, blur, chip).
- No margins for spacing; grid + gap only (narrow exceptions per CLAUDE.md).
- `@media (max-width: 700px)` collapses to a single column; `@media print`
  drops blur/shadow consistent with other sections.

## Definition of done

- `showcase` data present in `resume.json` with real descriptions and committed
  screenshots in `public/showcase/`.
- Section renders as `03 · Selected Work` between Experience and the subgrid.
- `bun system-check` passes (prettier, lint, vitest, build).
