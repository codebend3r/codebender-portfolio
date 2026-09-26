# CLAUDE.md

Operating rules for this repo.

## Workflow

- Do not commit anything until I tell you to.
- Do not push anything until I tell you to.
- Do not merge anything until I tell you to.
- Do not create a PR until I tell you to.
- Do not create a branch until I tell you to.

## Tooling

- All scripts run through Bun: `bun install`, `bun dev`, `bun run test`, `bun run build`, `bun lint:ts`, `bun lint:css`, `bun typecheck`. Never invoke npm or yarn. The full list lives in `package.json` `scripts` — check there rather than trusting this line.
- `bun system-check` is the gate: `format:check`, `typecheck`, `lint:ts`, `lint:css`, `lint:actions`, `spellcheck`, `test`, then `build`, run in sequence via `bun run --sequential`. There is no separate `check` script.
- Pin every `package.json` dependency to an exact version, with no `^` or `~`.

## Typescript

- Always use type aliases. Never use TypeScript interfaces anywhere, including `declare global` augmentations
- The single exception is augmenting an interface owned by a dependency, where declaration merging is the only mechanism that works — `ImportMeta` / `ImportMetaEnv` in `src/vite-env.d.ts` merge with `vite/client` and cannot be type aliases. Do not extend this exception to types this repo owns
- Use type guards wherever possible.
- Unit test all type guard functions
- Never use `any` types; prefer type narrowing or type guards
- Never under any circumstance cast types and never double cast: `as any as string`
- If type can't be inferred and type narrowing is not an option, use `unknown` types

## CSS

- Use CSS Modules (`*.module.css`) for component styles, co-located with the component
- There is no SCSS in this repo. Do not add a preprocessor
- Only use global stylesheets for design tokens and true typographic primitives: `src/styles/tokens.css` (custom properties), `src/styles/global.css` (element defaults), `src/styles/keyframes.css` (shared animations)
- Print/PDF colors are a second token source in `src/theme/tokens.ts`; a color that appears in both must be changed in both
- Use a container driven approach, meaning the container will define the width and height and the children will be positioned within it, this means if/when the children are moved to different containers they may be laid out differently depending on what the container specifies
- Prefer using CSS display grid for layout with the gap property for spacing between grid items; avoid using margins for spacing
- Second preferred display value is flex
- Avoid using plain divs; meaning divs with no class or id defined
- Always use token values from `src/styles/tokens.css` when defining font sizes, colors, and other design tokens like padding, margin, gap, and border radius

## Code style

- Always use front-end development best practices
- Prefer `reduce` over `for` loops when possible. Never use `for/in` or `for/of` loops; reach for `Array.prototype` methods (`map`, `filter`, `reduce`, `flatMap`, etc.) when the value is an array. Exception: test files may use `for/of` for assertion loops.
- Never write nested ternaries (enforced by the `no-nested-ternary` Oxlint rule). Use early returns, lookup maps, or extracted functions instead.
- Prefer double-bang (`!!value`) for boolean conversion.
- Prefer optional chaining (`?.`). When optional chaining is used, ALWAYS pair it with nullish coalescing (`??`) to supply a fallback.
- Prefer a single configurable object parameter over multiple positional parameters so argument order doesn't matter. Don't: `doSomething(foo, bar, hello)`. Do: `doSomething({ foo, bar, hello })`.

## Accessibility

- Use best practices for accessibility
- Use semantic HTML elements (`button`, `nav`, `main`, `header`, `ul`/`li`, `label`) before reaching for a generic element with a role; a native `button` beats a `div` with `onClick`
- Every interactive element must be reachable and operable by keyboard alone; preserve a logical tab order and never remove focus outlines without providing an equally visible `:focus-visible` style
- Associate every form control with a `label` (via `htmlFor`/`id` or wrapping); use `aria-describedby` for hints and error text
- Provide accessible names for icon-only controls with `aria-label`; mark purely decorative icons/images `aria-hidden="true"` and give meaningful images real `alt` text (empty `alt=""` when decorative)
- Add ARIA only to fill gaps native semantics can't; never override a native role, and prefer no ARIA over wrong ARIA
- Announce dynamic changes (toasts, async status, form errors) with an appropriate `aria-live` region or `role="alert"`
- Manage focus for modals, drawers, and menus: move focus in on open, trap it while open, restore it to the trigger on close, and close on `Escape`
- Meet WCAG AA contrast (4.5:1 body text, 3:1 large text and UI/graphical elements); verify against the color tokens in `src/styles/tokens.css`
- Respect `prefers-reduced-motion` and gate non-essential animation/transitions behind it
- Never convey meaning by color alone; pair it with text, an icon, or another cue
- Use relative units (`rem`) so the UI scales with user font-size settings, and keep layouts usable at 200% zoom
- Set a correct `lang` on the document and keep a single, ordered heading hierarchy (one `h1`, no skipped levels)

## Unit tests

- Tests are co-located as siblings, not in per-component folders: `src/utils/foo.ts` ↔ `src/utils/foo.test.ts`, `src/components/Foo.tsx` ↔ `src/components/Foo.test.tsx`.

## Commits

- Create a commit after every logical change, batch if they are related.
- Subject must start with `CJR:` followed by a short title (e.g., `CJR: a short title`).
- Favor bullet points in the body. Keep it concise and easy to read.

## Pull Requests

- Should follow the same naming convention as commits and every PR title should start with `CJR: a short title`
- The body of the PR should be minimal and favour bullet points
