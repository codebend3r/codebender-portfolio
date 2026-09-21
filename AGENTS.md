# AGENTS.md

This file provides guidance to Codex when working with code in this repository. `CLAUDE.md` is the companion policy file — this file describes what the codebase _is_, `CLAUDE.md` states how to write code in it. Keep both accurate; see the `docs-accuracy` skill.

## Commands

Package manager is **bun** (see `packageManager` in `package.json`). Use `bun <script>` rather than `npm`. Node version is pinned in `.nvmrc` and `engines.node`; both must stay in sync.

- `bun dev` — regenerates the CV PDF (`generate:cv`), then starts the Vite dev server
- `bun run build` — production build (note: `bun build` invokes Bun's bundler, not Vite; always use `bun run build`). Three steps via `bun run --sequential`: `generate:cv` → `build:vite` → `assert:no-react`
- `bun preview` — preview the built output
- `bun lint:ts` / `bun lint:ts:fix` — Oxlint (`.oxlintrc.json`), including type-aware rules
- `bun lint:css` / `bun lint:css:fix` — Gale (`@codebend3r/gale`, a Stylelint-compatible Rust linter) over `src/**/*.css`; reads `.stylelintrc.json`, which extends `stylelint-config-standard`
- `bun spellcheck` / `bun spellcheck:fix` — typos (`@ocular-d/typos-bin`) over the whole repo; it skips binaries and `.gitignore`d paths, and `_typos.toml` holds the exclude list and word allowlist
- `bun format` / `bun format:check` — Oxfmt write / check (`.oxfmtrc.json`)
- `bun format:staged` — lint-staged (`.lintstagedrc.json`): Oxfmt + `oxlint --fix` on staged JS/TS/JSON, `gale --fix` on staged CSS
- `bun typecheck` — `tsgo --noEmit` across all three tsconfig projects (root, `tsconfig.node.json`, `netlify/functions`)
- `bun test` / `bun test:watch` / `bun test:coverage` — Vitest
- `bun system-check` — `format:check` → `typecheck` → `lint:ts` → `lint:css` → `spellcheck` → `test` → `build`, in sequence via `bun run --sequential`

Script names drift. When this list disagrees with `"scripts"` in `package.json`, `package.json` wins and this list gets fixed in the same change.

### Git hooks

Husky runs on every commit and push:

- **pre-commit** (`.husky/pre-commit`): `format:staged` → `typecheck` → `test`. lint-staged formats and auto-fixes only the staged files and re-stages them; the full-repo `lint:ts` / `lint:css` gate runs in CI and `bun system-check`. The commit will fail if any step fails.
- **pre-push** (`.husky/pre-push`): `bun run build`, then prints the last 10 commits.

## Architecture

Resume/portfolio app. Vite + React 19 + TypeScript, styled with CSS Modules (`*.module.css` — there is no SCSS in this repo), state in Zustand. Routes are resolved in `src/pageForRoute.tsx`: the resume itself, an `/edit` editor (`src/edit/`), and a `/generate` flow (`src/generate/`) backed by Netlify functions. The same resume data also renders to PDF (`src/pdf/`), DOCX (`src/docx/`), and a React-free Angular build (`src/angular/`).

### Data flow

The resume is **fully data-driven** from `src/data/resume.json`:

1. `src/state/useStore.ts` creates a Zustand store seeded directly from `resume.json` at module load (no async fetch, no setters).
2. Components (`src/components/*`) call `useStore()` to read their slice — e.g. `Header` reads `name`/`title`/`contact`, `WorkExperience` reads `work_experience`, etc.
3. Types for the data shape live as **global ambient types** in `src/types/global.d.ts` (`Data` and its members) — referenced without import.

`src/data/resume.json` is the only copy of the resume data; `src/assets/` holds images only.

Adding a resume section touches more than the React tree — the same data renders to PDF, DOCX, and Angular, none of which have a failing test when a field is simply absent. See the `resume-section` skill for the full sequence.

### Path aliases

Aliases are declared in **two places that must stay in sync**: `vite.config.ts` (runtime resolution) and `tsconfig.json` `paths` (type resolution). Adding a new alias requires editing both files. Read the current set from those two files rather than from a list here — always use an alias over a relative import, and add one if none fits.

### Asset imports

`src/vite-env.d.ts` declares modules for `*.png` and `*.svg`, augments `ImportMeta`/`ImportMetaEnv` with the `VITE_SUPABASE_*` vars, and carries a shim for `@svgr/rollup`. SVGs import as a URL by default; the `ReactComponent` named export only works once `@svgr/rollup` is actually installed — the shim silences types but is **not** an install, and the package is not currently in `package.json`.

CSS Modules (`*.module.css`) are typed by `vite/client` and return a class map. The global sheets in `src/styles/` are imported for side effects only.

### Code style enforced by tooling

- Oxfmt: no semicolons, double quotes, 2-space indent, `printWidth: 80`, `trailingComma: "es5"`.
- Import order is enforced by Oxfmt's `sortImports`: react/next first, then builtin/external, then one group per path alias, then relative, then side-effect imports. The exact group order is the `groups` array in `.oxfmtrc.json` — read it there. Groups are separated by blank lines, and running `bun format` will reorder imports for you.
- Oxlint enforces `typescript/consistent-type-imports` — type-only imports must use `import type`.
- `_`-prefixed unused vars are ignored by the unused-vars rule.
