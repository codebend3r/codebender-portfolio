# `/angular-version` Angular Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public `/angular-version` route serving a visually faithful, React-free Angular recreation of the homepage, inside the existing Vite build.

**Architecture:** Second Vite MPA entry (`angular-version/index.html`) bootstraps a zoneless Angular 21 standalone app from `src/angular/`. `@analogjs/vite-plugin-angular` compiles `.ts` Angular components alongside the untouched React `.tsx` build. Framework-agnostic modules (`@utils/*`, `@sky`, `@weather`, `@styles/*`, `@data`, `@state/supabase`) are shared as-is; only the view layer is rewritten. A Bun build step pre-renders the CV PDF; a post-build assertion proves no React chunk is reachable from the Angular entry.

**Tech Stack:** Angular 21 (standalone, signals, zoneless), `@analogjs/vite-plugin-angular`, `@analogjs/vitest-angular`, Vite 8, Vitest 4, Bun.

**Execution note:** Executed in-session by an agent with the full repo open. Component-port tasks reference their React source + CSS module as the authoritative content and apply the Porting Recipe below verbatim; infrastructure files are given in full.

## Global Constraints

- All scripts through Bun (`bun install`, `bun run build`); never npm/yarn
- Every new dependency pinned exact (`bun add --exact`), no `^`/`~`
- Aliased imports only; new alias `@ng/*` → `src/angular/*` (safe vs `@angular/*` package scope)
- No `any`, no type casts; `unknown` + narrowing; type guards unit-tested
- Prefer `Array.prototype` methods over loops; `!!` for boolean conversion; `?.` always paired with `??`; single object params
- Tests co-located (`foo.ts` ↔ `foo.test.ts`)
- Commit per logical change, `CJR:` subject, bullet body, backticked identifiers, zero agent attribution
- `bun system-check` green at the end

## Porting Recipe (React → Angular), applied to every component task

| React idiom                                           | Angular idiom                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `styles from "*.module.css"` + `className={styles.x}` | `styleUrl: "./x.component.css"` (same rules/class names) + `class="x"`; emulated encapsulation replaces hashing                            |
| Props                                                 | `input()` / `input.required<T>()`                                                                                                          |
| `useState`                                            | `signal()`                                                                                                                                 |
| `useMemo`                                             | field initializer or `computed()`                                                                                                          |
| `useEffect` (DOM/rAF/listeners)                       | `afterNextRender()` + `DestroyRef.onDestroy()` for cleanup                                                                                 |
| `useCallback`                                         | class method                                                                                                                               |
| `{items.map(...)}`                                    | `@for (item of items; track $index)`                                                                                                       |
| `{cond && <X/>}` / ternary                            | `@if` / `@else`                                                                                                                            |
| Inline `style={{...}}`                                | `[style.left.%]`-style bindings; CSS custom props (`--cloud-drift`) via `element.style.setProperty` in code if `[style.--x]` binding fails |
| `aria-*`/`key`                                        | `[attr.aria-*]`; `track`                                                                                                                   |
| Component naming                                      | `src/angular/components/<name>.component.ts` + `.css` + `.test.ts`, selector `ng-<kebab>`, class `<Name>Component`                         |

Shared imports keep their aliases (`@utils/*`, `@sky`, `@weather`, `@data/*`, `@assets/*`, `@state/supabase`). Never import from `src/components/**`, `react*`, `zustand`, `@state/useAuth`, `@state/useStore`.

Test convention: co-located `*.component.test.ts` using `TestBed.configureTestingModule({ imports: [XComponent] })`, `fixture.detectChanges()`, DOM assertions mirroring the React component's existing `*.test.tsx` expectations (adapted, not copied).

---

### Task 1: Toolchain — deps, Vite MPA entry, Angular shell

**Files:**

- Modify: `package.json` (deps)
- Modify: `vite.config.ts`
- Modify: `tsconfig.json` (paths: `@ng/*`)
- Create: `angular-version/index.html`
- Create: `src/angular/main.ts`
- Create: `src/angular/app.component.ts`

**Interfaces:**

- Produces: `@ng/*` alias; `AppComponent` (standalone, selector `app-root`); MPA entry served at `/angular-version/`.

- [ ] **Step 1: Install pinned deps**

```bash
bun add --exact @angular/core @angular/common @angular/platform-browser @angular/compiler
bun add --exact --dev @angular/compiler-cli @analogjs/vite-plugin-angular @analogjs/vitest-angular
```

Verify `package.json` has no `^`/`~` on the new entries; note the resolved Angular major (expect 21.x) and Analog plugin version.

- [ ] **Step 2: Vite config**

In `vite.config.ts`: import `angular from "@analogjs/vite-plugin-angular"`; `plugins: [angular(), react()]`; add `"@ng": path.resolve(__dirname, "src/angular")` alias; add MPA input:

```ts
rollupOptions: {
  input: {
    main: path.resolve(__dirname, "index.html"),
    angularVersion: path.resolve(__dirname, "angular-version/index.html"),
  },
  output: { manualChunks },
},
```

In `manualChunks`, before the react checks: `if (id.includes("@angular/") || id.includes("@analogjs/")) return "angular"`.

- [ ] **Step 3: tsconfig paths** — add `"@ng/*": ["./src/angular/*"]`.

- [ ] **Step 4: HTML entry** — `angular-version/index.html`: copy head of root `index.html` (charset, viewport, favicon `/src/assets/robot-logo.png`, same Google Fonts links), `<title>CJ Rivas — Portfolio (Angular)</title>`, body:

```html
<app-root></app-root>
<script type="module" src="/src/angular/main.ts"></script>
```

- [ ] **Step 5: Bootstrap + shell**

`src/angular/main.ts`:

```ts
import "@angular/compiler"
import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { AppComponent } from "@ng/app.component"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

void bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
})
```

(`@angular/compiler` import only if JIT fallback is required — drop it if the Analog AOT transform works without it, which is expected.)

`src/angular/app.component.ts` (placeholder until Task 14):

```ts
import { ChangeDetectionStrategy, Component } from "@angular/core"

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Angular version</p>`,
})
export class AppComponent {}
```

- [ ] **Step 6: Smoke-verify dev + build**

```bash
bun dev & sleep 3 && curl -s http://localhost:4242/angular-version/ | grep app-root
bun run build && test -f dist/angular-version/index.html
```

Expected: dev HTML contains `<app-root>`; build emits `dist/angular-version/index.html`; existing `dist/index.html` unchanged. Kill dev server.

- [ ] **Step 7: Commit** — `CJR: add Angular toolchain and \`/angular-version\` MPA entry`

### Task 2: Vitest wiring + shell test

**Files:**

- Modify: `vitest.config.ts`
- Create: `src/angular/test-setup.ts`
- Create: `src/angular/app.component.test.ts`

**Interfaces:**

- Produces: Angular TestBed available in all `src/angular/**/*.test.ts`; React suites untouched.

- [ ] **Step 1:** `vitest.config.ts`: `plugins: [angular(), react()]`; `setupFiles: ["./src/test/setup.ts", "./src/angular/test-setup.ts"]`.

- [ ] **Step 2:** `src/angular/test-setup.ts`:

```ts
import { setupTestBed } from "@analogjs/vitest-angular/setup-testbed"
import "@angular/compiler"

setupTestBed()
```

(Default is zoneless; pass providers per-test if the API requires `provideZonelessChangeDetection` explicitly.)

- [ ] **Step 3:** Failing test `src/angular/app.component.test.ts`: TestBed creates `AppComponent`, asserts placeholder text renders. Run `bun run test src/angular` → confirm it exercises the Angular pipeline and passes (shell exists already, so the "fail first" check is the import/compile path erroring before wiring, passing after).

- [ ] **Step 4:** Full `bun run test` — all existing React suites still green.

- [ ] **Step 5: Commit** — `CJR: wire Angular TestBed into vitest`

### Task 3: `ResumeDataService` + `AuthService`

**Files:**

- Create: `src/angular/services/resume-data.service.ts` (+ `.test.ts`)
- Create: `src/angular/services/auth.service.ts` (+ `.test.ts`)

**Interfaces:**

- Produces: `ResumeDataService` — `readonly data: Data` (normalized clone of `@data/resume.json`, same `normalizeData` as `useStore`); `AuthService` — `readonly session: Signal<Session | null>`, `readonly ready: Signal<boolean>`, `readonly cloudConfigured: boolean`, `signOut(): Promise<void>` over shared `@state/supabase` client with `onAuthStateChange` subscription. No `useSync`, no zustand.

- [ ] Steps: failing tests first (resume service returns name `CJ Rivas`, arrays normalized; auth service with `vi.mock("@state/supabase")` — null client ⇒ `ready` true/`session` null/menu-hidden semantics; mock client ⇒ session signal follows `onAuthStateChange` callback, `signOut` delegates). Then implement, pass, commit — `CJR: add Angular resume data and auth services`

### Tasks 4–11: Component ports (Porting Recipe; React source + CSS module are authoritative)

Each task: write co-located failing test mirroring the React `*.test.tsx` behavior → port component + CSS → test passes → full `bun run test` green → commit.

- [ ] **Task 4:** `Section` (exemplar below), `Summary`, `Header` (contact links from `ResumeDataService`; render-only — no editing affordances), `Footer`. Commit: `CJR: port \`Section\`, \`Summary\`, \`Header\`, \`Footer\` to Angular`

Exemplar — `src/angular/components/section.component.ts`:

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core"

@Component({
  selector: "ng-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./section.component.css",
  template: `
    <section [id]="id()" class="section">
      @if (hasChip()) {
        <span class="chip">
          <span class="chipDot" aria-hidden="true"></span>
          {{ chipLabel() }}
        </span>
      }
      <h2 class="srTitle">{{ title() }}</h2>
      <ng-content />
    </section>
  `,
})
export class SectionComponent {
  readonly title = input.required<string>()
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly id = computed(() => this.title().toLowerCase().replace(/\s+/g, "-"))
  readonly hasChip = computed(
    () => this.index() !== undefined && this.eyebrow() !== undefined
  )
  readonly chipLabel = computed(
    () => `${String(this.index()).padStart(2, "0")} · ${this.eyebrow()}`
  )
}
```

`section.component.css` = contents of `src/components/Section.module.css` unchanged.

- [ ] **Task 5:** `TechnicalSkills` (port interactivity from `src/components/TechnicalSkills.tsx`). Commit: `CJR: port \`TechnicalSkills\` to Angular`
- [ ] **Task 6:** `WorkExperience` (uses `experienceDuration` util). Commit: `CJR: port \`WorkExperience\` to Angular`
- [ ] **Task 7:** `Showcase` (cards from store showcase data; images under `/showcase/`). Commit: `CJR: port \`Showcase\` to Angular`
- [ ] **Task 8:** `Awards`, `Languages`, `Education`. Commit: `CJR: port \`Awards\`, \`Languages\`, \`Education\` to Angular`
- [ ] **Task 9:** `Starfield` (canvas, DPR, rAF; cleanup via `DestroyRef`) + `Sky` (night: starfield+moon; else sun+parallax cloud layers, scroll rAF; sprites from `@assets/*`, `spritePosition`, `makeClouds`, `getCurrentSky`). Commit: `CJR: port \`Sky\` and \`Starfield\` to Angular`
- [ ] **Task 10:** `Weather` (rain/snow overlays via `makeDrops`, `fetchWeather`, `getWeatherOverride`) + `WeatherClock` (interval clock + `fetchWeatherDetails`). Commit: `CJR: port \`Weather\` and \`WeatherClock\` to Angular`
- [ ] **Task 11:** `SectionNav` (port `src/components/SectionNav.tsx` incl. IntersectionObserver/scroll behavior as implemented there). Commit: `CJR: port \`SectionNav\` to Angular`

### Task 12: Build-time CV PDF + `AppHeader`

**Files:**

- Create: `scripts/generate-cv-pdf.tsx`
- Modify: `package.json` (scripts), `.gitignore` (`public/cv/`)
- Create: `src/angular/components/app-header.component.ts` (+ css/test)

**Interfaces:**

- Produces: `public/cv/CJ-Rivas—…pdf` at a deterministic path exported as `CV_PDF_PATH` from `src/angular/cv-pdf-path.ts` (computed with `documentFileName({ name, label, extension: "pdf" })` from resume data so header link and script agree); `AppHeaderComponent` renders `WeatherClock` + `<a class="downloadButton" [href]="cvPdfPath" download>` + `HeaderComponent`.

- [ ] **Step 1:** `scripts/generate-cv-pdf.tsx` (run with Bun): import `generateResumePdf` from `@pdf`, `normalizeData` + `resume.json`, render to blob/buffer, write `public/cv/<documentFileName>.pdf`. Alias resolution: run via `bun --tsconfig-override` not needed — Bun reads `tsconfig.json` paths natively.
- [ ] **Step 2:** Scripts: `"generate:cv": "bun scripts/generate-cv-pdf.tsx"`, `"build:vite": "vite build"`, `"build": "run-s generate:cv build:vite"` (assert step added Task 15), `"dev": "run-s generate:cv dev:vite"` with `"dev:vite": "vite"`. Netlify dev `targetPort` unaffected.
- [ ] **Step 3:** Run `bun run generate:cv`; verify PDF exists and opens (non-zero size, `%PDF` magic).
- [ ] **Step 4:** `AppHeader` port with download anchor (no `isGenerating` state — static asset), inline `DownloadIcon` SVG in template.
- [ ] **Step 5:** Tests + commit — `CJR: add build-time CV PDF and Angular \`AppHeader\``

### Task 13: `SideMenu` port

**Files:**

- Create: `src/angular/components/side-menu.component.ts` (+ css/test)

**Interfaces:**

- Consumes: `AuthService` signals.
- Produces: hidden when `!cloudConfigured || session() === null`; toggle button + backdrop + drawer with Home/Edit Resume/Generate links (`aria-current` on none — current page is `/angular-version`, not in LINKS; keep list parity with React) and Sign out calling `auth.signOut()`; Escape closes (host listener).

- [ ] Failing test (mocked `@state/supabase`) → port → pass → commit — `CJR: port \`SideMenu\` to Angular`

### Task 14: Compose `App` + `applySky`

**Files:**

- Modify: `src/angular/app.component.ts` (+ create `app.component.css` from `src/App.module.css`, update test)
- Modify: `src/angular/main.ts` (call `applySky()` before bootstrap)

- [ ] Compose exactly like `src/App.tsx`: `Sky`, `Weather`, `SectionNav`, `SideMenu`, then `#resume-root` with `AppHeader`, main sections in the same order/indices (`TechnicalSkills` 1 Stack, `WorkExperience` 2 Experience, `Showcase` 3 Selected Work, subgrid: `Awards` 4 Recognition, `Languages` 5 Languages, `Education` 6 Education), `Footer`.
- [ ] Test: renders all landmark sections. Commit — `CJR: compose Angular homepage in \`AppComponent\``

### Task 15: Redirects + no-React guardrail

**Files:**

- Modify: `public/_redirects`
- Create: `scripts/assert-no-react.mjs`
- Modify: `package.json` (`"assert:no-react"`, `"build": "run-s generate:cv build:vite assert:no-react"`)

- [ ] `_redirects` (order matters):

```
/angular-version/* /angular-version/index.html 200
/* /index.html 200
```

- [ ] `scripts/assert-no-react.mjs`: read `dist/angular-version/index.html`, collect `<script src>`/`<link rel=modulepreload>` URLs, recursively scan those chunks for static `import` specifiers, resolving within `dist/`; fail (exit 1, listing offenders) if any visited chunk filename matches `/(react|react-dom|zustand)/` or contains sentinel strings `"react.production"`/`"react-dom"`/`"zustand"`. Also assert the graph is non-empty (guards against the entry silently emitting nothing).
- [ ] Run `bun run build` → assertion passes. Temporarily import `react` in `app.component.ts` → build fails → revert (proves the guard works).
- [ ] Commit — `CJR: route \`/angular-version\` on Netlify and assert React-free bundle`

### Task 16: Full verification

- [ ] `bun system-check` green (prettier, tsc ×2, eslint, vitest, build+assert).
- [ ] Launch dev, load `/?sky=night` vs `/angular-version/?sky=night` (and `day`, `?weather=rain`) — compare rendered DOM/visuals side by side; fix parity gaps.
- [ ] Verify public access story: no auth code in the Angular entry, `/angular-version` reachable with no session.
- [ ] README: add `/angular-version` row to the routes/commands section if one exists.
- [ ] Final commit for any fixes — `CJR: polish Angular homepage parity`

## Self-Review

- **Spec coverage:** decisions 1–4 → Tasks 12, 9/10, 13, 1; guardrail → 15; testing → 2 + per-task; redirects/public → 15/16. No gaps found.
- **Placeholders:** component tasks intentionally delegate content to named source files per the Execution note — accepted for in-session execution; infra files are complete.
- **Type consistency:** `Data` comes from global `src/types/global.d.ts` (no import needed); service/component names used consistently (`ResumeDataService.data`, `AuthService.session/ready/signOut`, `SectionComponent` inputs `title/index/eyebrow`).
