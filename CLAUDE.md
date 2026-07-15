# CLAUDE.md

Operating rules for this repo.

## Workflow

- Always create a branch for each feature or bug fix.
- Auto-commit each logical change without asking.

## Tooling

- All scripts run through Bun: `bun install`, `bun dev`, `bun run test`, `bun run build`, `bun run lint`. Never invoke npm or yarn.
- Pin every `package.json` dependency to an exact version, with no `^` or `~`.

## Typescript

- Use type guards wherever possible.
- Never use `any` types; prefer type narrowing or type guards
- Never under any circumstance cast types and never double cast: `as any as string`
- If type can't be inferred and type narrowing is not an option, use `unknown` types
- Unit test all type guard functions

## Code style

- Always use front-end development best practices
- Prefer `reduce` over `for` loops when possible. Never use `for/in` or `for/of` loops; reach for `Array.prototype` methods (`map`, `filter`, `reduce`, `flatMap`, etc.) when the value is an array.
- Never write nested ternaries (enforced by the `no-nested-ternary` ESLint rule). Use early returns, lookup maps, or extracted functions instead.
- Prefer double-bang (`!!value`) for boolean conversion.
- Prefer optional chaining (`?.`). When optional chaining is used, ALWAYS pair it with nullish coalescing (`??`) to supply a fallback.
- Prefer a single configurable object parameter over multiple positional parameters so argument order doesn't matter. Don't: `doSomething(foo, bar, hello)`. Do: `doSomething({ foo, bar, hello })`.

## Unit tests

- Tests are co-located: `lib/foo.ts` ↔ `lib/foo.test.ts`, `components/Foo/Foo.tsx` ↔ `components/Foo/Foo.test.tsx`.

## Commits

- Create a commit after every logical change, batch if they are related.
- Subject must start with `CJR:` followed by a short title (e.g., `CJR: a short title`).
- Favor bullet points in the body. Keep it concise and easy to read.
