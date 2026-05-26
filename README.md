# CJ Rivas Portfolio

> Single-page resume/portfolio built with React 19, TypeScript, and Vite.

## Stack

- **Build / dev:** Vite 8
- **UI:** React 19 + TypeScript 6
- **Styling:** Panda CSS (with codegen step before dev/build)
- **State:** Zustand (seeded from `src/data/resume.json`)
- **PDF export:** html2pdf.js
- **Testing:** Vitest + Testing Library (jsdom)
- **Lint / format:** ESLint 9 (flat config) + Prettier
- **Hooks:** Husky (pre-commit: type-check, format, lint, build)
- **Package manager:** Bun

## Dev

```bash
bun install
bun dev
```

## Build

```bash
bun run build
bun preview
```

## Scripts

- `bun dev` — Vite dev server (runs Panda codegen first)
- `bun run build` — production build
- `bun preview` — preview the built output
- `bun test` / `bun test:watch` / `bun test:coverage` — Vitest
- `bun lint` / `bun lint:fix` — ESLint
- `bun prettier` / `bun prettier:check` — Prettier write / check
- `bun ts:check` — TypeScript type check (no emit)
- `bun system-check` — `prettier:check` → `lint` → `test` → `build`
