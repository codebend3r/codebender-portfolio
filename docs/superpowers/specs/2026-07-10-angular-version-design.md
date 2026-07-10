# `/angular-version` — Angular recreation of the homepage

**Date:** 2026-07-10
**Status:** Approved (user: "Just do it")

## Goal

A public, non-auth-gated `/angular-version` route that serves a visually faithful
recreation of the homepage (`/`) built entirely in Angular. No React code loads on
the route — enforced by an automated build assertion, not convention.

## Decisions (user-confirmed)

1. **Download CV** — PDF is generated at build time by running the existing
   `@pdf` react-pdf pipeline in a Bun script. React runs at build time only.
2. **Effects scope** — full parity: time-of-day sky, canvas starfield + moon,
   sun sprite + parallax clouds, geolocation → Open-Meteo rain/snow overlays,
   live weather clock, `?sky=` / `?weather=` overrides.
3. **SideMenu** — ported, including Supabase session detection. Sign-in stays on
   the React `/login`; the session persists in localStorage per-origin, so the
   owner is recognized on `/angular-version` automatically.
4. **Toolchain** — `@analogjs/vite-plugin-angular` inside the existing Vite
   build (single toolchain, MPA second entry). Not a separate CLI workspace.

## Architecture

### Build integration (Vite MPA)

- New `angular-version/index.html` at the repo root; added to
  `build.rollupOptions.input`. Vite serves `/angular-version/` in dev and emits
  `dist/angular-version/index.html`. Head mirrors `index.html` (fonts, favicon,
  title); body bootstraps `src/angular/main.ts` into `<app-root>`.
- `@analogjs/vite-plugin-angular` first in the plugins array of `vite.config.ts`
  and `vitest.config.ts`; `@vitejs/plugin-react` stays. Angular components live
  in `.ts`, React in `.tsx` — no compiler overlap. Scope with the plugin's
  include/exclude options only if a conflict appears.
- `manualChunks`: `@angular/*` packages → dedicated `angular` chunk group.
- `public/_redirects`: `/angular-version/* /angular-version/index.html 200`
  **above** the `/* /index.html 200` catch-all.
- New deps (pinned exact): `@angular/core`, `@angular/common`,
  `@angular/platform-browser`, `@angular/compiler`; dev:
  `@angular/compiler-cli`, `@analogjs/vite-plugin-angular`,
  `@analogjs/vitest-angular`. No `zone.js` (zoneless), no router (MPA entry
  owns the URL), no forms.

### Angular app — `src/angular/`

Angular 21, standalone components, signals-first (`signal()`, `computed()`,
`input()`, `inject()`), zoneless change detection
(`provideZonelessChangeDetection()`).

One component per React counterpart: `Sky`, `Starfield`, `Weather`,
`WeatherClock`, `AppHeader`, `Header`, `SectionNav`, `Section`, `Summary`,
`TechnicalSkills`, `WorkExperience`, `Showcase`, `Awards`, `Languages`,
`Education`, `Footer`, `SideMenu`, plus a root `App` component composing them
exactly like `src/App.tsx`.

**Only the view layer is rewritten.** Shared framework-agnostic modules are
imported as-is via existing aliases: `@utils/*` (`skyForHour`, `particles`,
`spriteSheet`, `openMeteo`, `normalizeData`, `documentFileName`), `@sky`,
`@weather`, `@styles/*` (`tokens.css`, `global.css`, `keyframes.css`),
`@assets/*` sprites, `@data/resume.json`, `@state/supabase` (plain client).

Styles: each `*.module.css` ports to a component `styleUrl` with identical class
names and rules; Angular's emulated view encapsulation replaces CSS-module
hashing, so rendering is unchanged.

Services (replacing React state hooks):

- **`ResumeDataService`** — `normalizeData(structuredClone(resume.json))`
  exposed readonly. No zustand: its main entry imports React.
- **`AuthService`** — signals (`session`, `ready`) wrapping the shared Supabase
  client's `onAuthStateChange`, plus `signOut()`. Powers `SideMenu`; when
  Supabase env is absent or no session, the menu renders nothing (parity with
  React). No cloud resume sync on this page — it renders the checked-in
  `resume.json` only.

`main.ts` imports the shared global styles, calls the shared `applySky()`
(parity with `Entry.tsx` for the app route), then `bootstrapApplication`.

### Download CV (build-time PDF)

- `scripts/generate-cv-pdf.tsx`, run with Bun (native TSX): imports
  `generateResumePdf` from `@pdf` and `resume.json` (normalized), writes to
  `public/cv/<documentFileName>.pdf`. `public/cv/` is gitignored.
- Scripts: `generate:cv` runs it; `build` becomes
  `run-s generate:cv build:vite assert:no-react` (`build:vite` = `vite build`).
  `dev` gains a pre-step so the link works locally.
- Angular `AppHeader` renders an `<a download href>` styled identically to the
  React download button. Fallback runner if Bun trips on react-pdf: `vite-node`.

### No-React guardrail

`scripts/assert-no-react.mjs` runs post-build: starting from
`dist/angular-version/index.html`, recursively walk `<script>`/import graph and
fail if any chunk resolves to `react`, `react-dom`, `scheduler`, or `zustand`
modules (via the build manifest / chunk names). Wired into `build` so CI and the
pre-push hook enforce it.

## Testing

- Angular specs run under the **existing** vitest config: add the Angular
  plugin, a `src/angular/test-setup.ts` (`@angular/compiler` +
  `@analogjs/vitest-angular` zoneless `setupTestBed()`), appended to
  `setupFiles`. Co-located `*.test.ts` per component/service, matching repo
  convention. React tests must be unaffected.
- Root `tsc` covers `src/angular`; AOT template checking happens in the Vite
  build.
- `bun system-check` (prettier → tsc → lint → test → build, which now includes
  the no-React assertion) is the completion gate.

## Error handling

Same behavior as React: weather fetch/geolocation failure → no overlay; missing
Supabase env → SideMenu hidden; PDF is a static asset so no runtime failure
mode. Angular `ErrorHandler` default is sufficient — no bespoke handling.

## Risks & mitigations

| Risk                                                                                 | Mitigation                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Analog plugin vs Vite 8 / React plugin coexistence                                   | Plugin ordering (Angular first); its include/exclude scoping; verify in step 1 with a smoke build                  |
| `resolve.mainFields: ['module']` suggested by Analog README could disturb React deps | Start without it (Vite default already prefers `module`); scope only if Angular misresolves                        |
| `useDefineForClassFields: true` in root tsconfig                                     | Signals + `inject()` avoid decorated-field pitfalls; fallback: dedicated `tsconfig.angular.json` via plugin option |
| Bun executing react-pdf at build time                                                | Fallback: `vite-node` runner                                                                                       |

## Success criteria

1. Public `/angular-version` renders a visually faithful homepage clone for the
   same time/weather conditions; overrides behave identically.
2. `assert-no-react` passes on every build; existing routes and tests untouched
   (`bun system-check` green).
3. Download CV serves a PDF generated from the current `resume.json`.
4. SideMenu appears only for a signed-in owner, hidden for the public.
