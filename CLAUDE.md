# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **bun** (see `packageManager` in `package.json`). Use `bun <script>` rather than `npm`.

- `bun dev` — Vite dev server
- `bun run build` — production build (note: `bun build` invokes Bun's bundler, not Vite; always use `bun run build`)
- `bun preview` — preview the built output
- `bun lint` / `bun lint:fix` — ESLint (flat config)
- `bun prettier` / `bun prettier:check` — Prettier write / check
- `bun ts:check` — `tsc` type check (no emit)
- `bun test` / `bun test:watch` / `bun test:coverage` — Vitest
- `bun system-check` — runs `prettier:check`, `lint`, `test`, `build` sequentially via `npm-run-all`

### Git hooks

Husky runs on every commit and push:

- **pre-commit** (`.husky/pre-commit`): `ts:check` → `prettier` (write) → `lint` → `build`. The commit will fail if any step fails. Note that `prettier` _writes_ changes — if formatting was off, the hook fixes the files but does not auto-stage them, so re-stage and recommit.
- **pre-push** (`.husky/pre-push`): `bun run build`, then prints the last 10 commits. The push will fail if the build fails, so deps must be installed (`bun install`) before pushing.

## Architecture

Single-page resume/portfolio. Vite + React 19 + TypeScript, styled with plain CSS Modules, state in Zustand.

### Data flow

The resume is **fully data-driven** from `src/data/resume.json`:

1. `src/state/useStore.ts` creates a Zustand store seeded directly from `resume.json` at module load (no async fetch, no setters).
2. Components (`src/components/*`) call `useStore()` to read their slice — e.g. `Header` reads `name`/`title`/`contact`, `WorkExperience` reads `work_experience`, etc.
3. Types for the data shape live as **global ambient types** in `src/types/global.d.ts` (`Experience`, `Award`, `Language`, `Education`, `Data`) — referenced without import.

When adding a new resume section: extend `resume.json` → add a type to `src/types/global.d.ts` → extend `StoreState` in `useStore.ts` → create a component in `src/components/` → mount it in `src/App.tsx`. Note there's also a duplicate `src/assets/resume.json` (unused by the store); the canonical source is `src/data/resume.json`.

### Path aliases

Aliases are declared in **two places that must stay in sync**: `vite.config.ts` (runtime resolution) and `tsconfig.json` `paths` (type resolution). Current aliases: `@App`, `@app`, `@assets/*`, `@components/*`, `@data/*`, `@sky`, `@state/*`, `@styles/*`, `@utils/*`, `@weather`. Adding a new alias requires editing both files.

### Styling

Plain CSS Modules — every component pairs with a colocated `<Name>.module.css` file (e.g. `Header.tsx` ↔ `Header.module.css`). Class names produced by Vite are of the form `<Name>_<local>__<hash>`, which makes DevTools inspection straightforward. Three shared stylesheets in `src/styles/` are imported once from `src/Entry.tsx`:

- `tokens.css` — `:root` CSS custom properties (`--bg`, `--panel`, `--text`, `--muted`, `--accent`, `--accent2`, `--border`, `--cloud-drift`)
- `keyframes.css` — `cloudDrift`, `rainFall`, `snowFall`, `glowPulse`
- `global.css` — body/html resets, anchor styling, `@media print` rules

Reference tokens inside modules as `var(--accent)` etc. The previous Panda-CSS toolchain (`panda.config.ts`, `styled-system/`, `postcss.config.cjs`) was removed in favor of this approach — see `docs/superpowers/specs/2026-05-26-css-modules-migration-design.md`.

#### Spacing convention: no margins, use grid + gap

Do **not** use CSS `margin` (any of `margin`, `margin-top`, `margin-bottom`, `margin-left`, `margin-right`, `margin-block`, `margin-inline`) to space elements. Instead, make the parent a grid container and use `gap` to separate its children:

```css
.parent {
  display: grid;
  grid-template-columns: 1fr; /* or whatever column spec the layout needs */
  gap: 20px;
}
```

This applies to sibling separation (e.g. stacked sections inside `<main>`) **and** internal separation between a heading and its content inside a panel: make the container a grid with `gap` and zero the heading's margin. Spacing then lives in one place (the parent), so adjustments don't require touching every child.

Narrow exceptions: `margin: 0 auto` for centering a fixed-width container horizontally, and `margin: 0` resets are fine. Everything else: gap on a parent.

### Asset imports

`src/vite-env.d.ts` declares modules for `*.png`, `*.svg`, `*.scss`, and `@svgr/rollup`. SVGs can be imported as a URL (default) or — once `@svgr/rollup` is wired in — as a React component via the `ReactComponent` named export.

### Code style enforced by tooling

- Prettier: no semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`.
- Import order is enforced by `@trivago/prettier-plugin-sort-imports` with custom groups (react/next first, then third-party, then `@components`, `@data`, `@state`, `@styles`, etc., then relative). Groups are separated by blank lines. Running `bun prettier` will reorder imports.
- ESLint enforces `@typescript-eslint/consistent-type-imports` — type-only imports must use `import type`.
- `_`-prefixed unused vars are ignored by the unused-vars rule.
