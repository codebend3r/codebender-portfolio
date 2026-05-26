# Migrate from Panda CSS to plain CSS Modules

**Status:** Design — approved direction; awaiting written-spec review.
**Date:** 2026-05-26

## Motivation

Panda CSS generates atomic utility classes (`.bg_bg`, `.pos_relative`, `.z_1`). Every styled element carries a string of one-rule classes that don't map back to anything meaningful in source, which makes DevTools inspection hard: you can't tell which component owns a rule, and the class names give no hint about intent.

Plain CSS Modules produce class names like `Header_root__h7a2k` — the component name is right there, source is one search away, and the rules grouped under the class match what you wrote.

## Goals

- Strict like-for-like visual port — no design changes.
- Readable class names in DevTools (`<ComponentName>_<localName>__<hash>`).
- Keep typed-token-ish ergonomics by exposing design tokens as CSS custom properties on `:root`.
- Drop the Panda toolchain (`@pandacss/dev`, `panda codegen`, `styled-system/` output, postcss config).
- Single PR, multiple commits — one per logical step.

## Non-goals

- Changing visual design, layout, animations, or color palette.
- Introducing `clsx` or a className composer (one component composes two classes — inline template literal is fine).
- Resurrecting or refactoring the unused `--glow1`/`--glow2` runtime variables set by `applySky()` — see "Out of scope" below.
- Adding any new variants, recipes, or component patterns.

## Current state — what Panda does today

Pulled from a scan of `src/`:

- **9 files** use `css()` from `@styled-system/css`: `App.tsx`, `components/Footer.tsx`, `components/Header.tsx`, `components/Section.tsx`, `components/Sky.tsx`, `components/Starfield.tsx`, `components/TechnicalSkills.tsx`, `components/Weather.tsx`, `components/WorkExperience.tsx`.
- **1 file** uses `cva()`: `components/Sky.tsx` — `sunStyles` with `day` / `dawn` / `dusk` variants (the three variants share only `position: absolute; border-radius: 50%`).
- **`token(colors.X)` references** are sprinkled inside gradients, borders, box-shadows where Panda's shorthand didn't apply.
- **Design tokens** in `panda.config.ts`: 7 colors — `bg #0b0e14`, `panel #111622`, `text #e6ebf5`, `muted #9aa4b2`, `accent #7aa2f7`, `accent2 #c678dd`, `border #1b2233`.
- **Keyframes** in `panda.config.ts`: `cloudDrift`, `rainFall`, `snowFall`, `glowPulse`.
- **Global styles** via `defineGlobalStyles` — box-sizing, html/body sizing, body font/color/bg, anchor styles, `@media print .no-print`.
- **Global vars**: `--cloud-drift` declared in panda config; set inline per cloud element.
- **Components NOT using Panda**: `Awards.tsx`, `Education.tsx`, `Languages.tsx`, `Summary.tsx` — their visuals come from descendant selectors in `Section`'s styles (e.g., `& h2 { … }`).

## Decisions

| Decision                       | Choice                                                                 | Rationale                                                                      |
| ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Module flavor                  | Plain CSS Modules (`.module.css`)                                      | Vite supports natively; nesting is native CSS now; no extra devDep             |
| Token storage                  | CSS custom properties on `:root` in `src/styles/tokens.css`            | Composes with existing dynamic CSS vars; one-click resolved values in DevTools |
| Variant strategy (Sky's `cva`) | Three sibling classes composed with a base                             | Only three variants in one site; no need for `clsx`                            |
| File layout                    | Modules colocated with components (`Header.tsx` + `Header.module.css`) | Standard React convention; navigation is trivial                               |
| Migration staging              | Single PR, multiple commits                                            | Codebase is small (9 files); coexistence period adds no value                  |

## Architecture

### File layout

```
src/
  App.tsx
  App.module.css
  Entry.tsx                # imports the three global stylesheets
  components/
    Header.tsx
    Header.module.css
    Footer.tsx
    Footer.module.css
    Section.tsx
    Section.module.css
    Sky.tsx
    Sky.module.css
    Starfield.tsx
    Starfield.module.css
    TechnicalSkills.tsx
    TechnicalSkills.module.css
    Weather.tsx
    Weather.module.css
    WorkExperience.tsx
    WorkExperience.module.css
  styles/
    tokens.css       # :root custom properties
    keyframes.css    # 4 @keyframes
    global.css       # body, html, anchor, @media print rules
```

The existing `src/styles/index.css` (which only declares Panda's `@layer` order) is deleted.

### Tokens — `src/styles/tokens.css`

```css
:root {
  --bg: #0b0e14;
  --panel: #111622;
  --text: #e6ebf5;
  --muted: #9aa4b2;
  --accent: #7aa2f7;
  --accent2: #c678dd;
  --border: #1b2233;
}
```

### Keyframes — `src/styles/keyframes.css`

Verbatim port of the four keyframes from `panda.config.ts`. `--cloud-drift` continues to be set inline per cloud element.

### Globals — `src/styles/global.css`

Verbatim port of `defineGlobalStyles`:

```css
* {
  box-sizing: border-box;
}
html,
body,
#root {
  height: 100%;
}
body {
  margin: 0;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    Arial,
    "Noto Sans",
    "Apple Color Emoji",
    "Segoe UI Emoji";
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
}
a {
  color: var(--accent);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
@media print {
  .no-print {
    display: none !important;
  }
}
```

### Entry import order — `src/Entry.tsx`

```ts
import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"
```

The current `import "@styles/index.css"` in `App.tsx` is removed.

### Component pattern

```tsx
import styles from "./Header.module.css"

export function Header() {
  return <header className={styles.root}>…</header>
}
```

`token(colors.X)` references become `var(--X)`. Everything else is a verbatim port of the existing rule.

### Sky variant pattern

```css
.sun {
  position: absolute;
  border-radius: 50%;
}
.sunDay {
  /* day-specific position/size/background/box-shadow */
}
.sunDawn {
  /* dawn-specific … */
}
.sunDusk {
  /* dusk-specific … */
}
```

```tsx
const kindClass = {
  day: styles.sunDay,
  dawn: styles.sunDawn,
  dusk: styles.sunDusk,
}[kind]
return <div className={`${styles.sun} ${kindClass}`} />
```

## Build & config changes

- Remove `@pandacss/dev` from `devDependencies` in `package.json`.
- Strip `panda codegen --clean &&` from `dev`, `build`, `ts:check`, `prepare`; delete the `panda:codegen` script.
- Delete `panda.config.ts`, `postcss.config.cjs` (only present for Panda), and the generated `styled-system/` directory.
- Remove the `@styled-system` alias from `vite.config.ts` and the matching `paths` entry in `tsconfig.json`.
- Remove the `styled-system/` entry from `.gitignore` if present (no longer needed once the directory is deleted).
- Update `CLAUDE.md`: replace the styling description to "CSS Modules (plain CSS) with shared tokens/keyframes/globals in `src/styles/`".

## Test & verification plan

- Existing component tests assert on text and structure (not class names) — should pass unchanged.
- `Sky.test.tsx` mocks `getCurrentSky` — unaffected.
- `sky.test.ts` asserts `applySky` sets `--bg`/`--glow1`/`--glow2` on `:root`. Still passes — behavior preserved. After this migration `--bg` is read by `body { background: var(--bg) }`, so the body bg will follow the time-of-day palette. That is a deliberate consequence noted in "Out of scope" below.
- After each commit, the Husky `pre-commit` chain (`ts:check` → `prettier` → `lint` → `build`) acts as a verification gate.
- Final manual smoke: `bun dev`, load `http://localhost:4242/`, verify:
  - Sky renders (sun + clouds during day; check `?sky=night`, `?sky=dawn`, `?sky=dusk`).
  - Weather renders (`?weather=rain`, `?weather=snow`).
  - Hover tooltips on technical-skill pills.
  - Download PDF button still produces a PDF with the expected bg color.

## Out of scope (deliberate)

- `applySky()` sets `--bg`/`--glow1`/`--glow2` on `<html>` today, but no compiled CSS reads them. After migration `body { background: var(--bg) }` will read `--bg`, so the body bg will start tracking time of day. That's a small unintended freebie — we accept it. `--glow1`/`--glow2` remain unread; either remove them later or wire them up in a follow-up.
- Introducing `clsx`/`classnames`. One site of two-class composition (Sky's sun) — string concat is fine.
- Visual / structural refactors.

## Migration order (commit plan)

1. Add `src/styles/tokens.css`, `keyframes.css`, `global.css`. Wire them into `src/Entry.tsx`. Don't remove Panda yet.
2. Migrate `App.tsx` → `App.module.css`. Verify build + smoke.
3. Migrate `Section.tsx` → `Section.module.css` (also covers Awards/Education/Languages/Summary children).
4. Migrate `Header.tsx`, `Footer.tsx`, `Weather.tsx`, `Starfield.tsx`, `TechnicalSkills.tsx`, `WorkExperience.tsx` — one commit per component.
5. Migrate `Sky.tsx` (last — most complex, includes `cva` → multi-class).
6. Remove Panda: delete `panda.config.ts`, `postcss.config.cjs`, `styled-system/`, `src/styles/index.css`; strip from `vite.config.ts`, `tsconfig.json`, `package.json`; drop `@pandacss/dev`.
7. Update `CLAUDE.md` styling section.

Each commit follows [`codebender-portfolio` commit format](../../../CLAUDE.md): title-case imperative subject with backticked identifiers, bullet body, no AI attribution.

## Open questions

None. All major decisions resolved (module flavor, tokens, layout, staging, variant strategy).
