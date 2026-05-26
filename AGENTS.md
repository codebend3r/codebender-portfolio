# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

Package manager is **bun** (see `packageManager` in `package.json`). Use `bun <script>` rather than `npm`.

- `bun dev` — Vite dev server
- `bun run build` — production build (note: `bun build` invokes Bun's bundler, not Vite; always use `bun run build`)
- `bun preview` — preview the built output
- `bun lint` / `bun lint:fix` — ESLint (flat config)
- `bun prettier` / `bun prettier:check` — Prettier write / check
- `bun ts:check` — `tsc` type check (no emit)
- `bun system-check` — runs `prettier:check`, `lint`, `build` sequentially via `npm-run-all`

No test runner is configured.

### Git hooks

Husky runs on every commit and push:

- **pre-commit** (`.husky/pre-commit`): `ts:check` → `prettier` (write) → `lint` → `build`. The commit will fail if any step fails. Note that `prettier` _writes_ changes — if formatting was off, the hook fixes the files but does not auto-stage them, so re-stage and recommit.
- **pre-push** (`.husky/pre-push`): runs `bin/pre-push.sh` which prints the last 10 commits.

## Architecture

Single-page resume/portfolio. Vite + React 19 + TypeScript, styled with SCSS, state in Zustand.

### Data flow

The resume is **fully data-driven** from `src/data/resume.json`:

1. `src/state/useStore.ts` creates a Zustand store seeded directly from `resume.json` at module load (no async fetch, no setters).
2. Components (`src/components/*`) call `useStore()` to read their slice — e.g. `Header` reads `name`/`title`/`contact`, `WorkExperience` reads `work_experience`, etc.
3. Types for the data shape live as **global ambient types** in `src/types/global.d.ts` (`Experience`, `Award`, `Language`, `Education`, `Data`) — referenced without import.

When adding a new resume section: extend `resume.json` → add a type to `src/types/global.d.ts` → extend `StoreState` in `useStore.ts` → create a component in `src/components/` → mount it in `src/App.tsx`. Note there's also a duplicate `src/assets/resume.json` (unused by the store); the canonical source is `src/data/resume.json`.

### Path aliases

Aliases are declared in **two places that must stay in sync**: `vite.config.ts` (runtime resolution) and `tsconfig.json` `paths` (type resolution). Current aliases: `@App`, `@app`, `@data/*`, `@components/*`, `@state/*`, `@styles/*`. Adding a new alias requires editing both files.

### Asset imports

`src/vite-env.d.ts` declares modules for `*.png`, `*.svg`, `*.scss`, and `@svgr/rollup`. SVGs can be imported as a URL (default) or — once `@svgr/rollup` is wired in — as a React component via the `ReactComponent` named export. SCSS imports return a class map for CSS Modules; global stylesheets like `src/styles/global.scss` are imported for side effects only.

### Code style enforced by tooling

- Prettier: no semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`.
- Import order is enforced by `@trivago/prettier-plugin-sort-imports` with custom groups (react/next first, then third-party, then `@components`, `@data`, `@state`, `@styles`, etc., then relative). Groups are separated by blank lines. Running `bun prettier` will reorder imports.
- ESLint enforces `@typescript-eslint/consistent-type-imports` — type-only imports must use `import type`.
- `_`-prefixed unused vars are ignored by the unused-vars rule.
