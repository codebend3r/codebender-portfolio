---
name: docs-accuracy
description: Use when editing `CLAUDE.md`, `AGENTS.md`, or `README.md`, when renaming a `package.json` script, adding a path alias, changing the styling system, or whenever a doc claim about this repo might have gone stale. Every factual claim in an instruction file must be verifiable with a command.
---

# Instruction-File Accuracy

## Overview

`CLAUDE.md` and `AGENTS.md` are loaded into the context of every agent session
before any file is read. A wrong claim in them is not a documentation bug — it is a
**bad instruction that gets followed**. An agent told "use SCSS modules" in a repo with
zero SCSS files will create `.module.scss`, and every downstream tool (Stylelint lints
`src/**/*.css` only) silently ignores it.

Docs drift because they describe intent at authoring time and are never re-checked.
This skill makes drift mechanically detectable.

**The rule: every factual claim in an instruction file must be verifiable by a command
that can be run right now.** Aspirational claims ("prefer grid over margins") are fine —
those are policy. Descriptive claims ("styled with SCSS", "`bun lint` runs Oxlint",
"aliases are `@app`, `@data`") are facts, and facts rot.

## When to Use

- Editing `CLAUDE.md`, `AGENTS.md`, or the architecture sections of `README.md`.
- Renaming, adding, or removing a `package.json` script.
- Adding a path alias, changing the styling system, or moving a canonical data file.
- Any time a doc says a file exists — check that it still does.
- Before trusting an instruction file's description of tooling. If it disagrees with
  `package.json`, `package.json` wins and the doc gets fixed in the same change.

## The Claim Inventory

These are the claim classes that go stale in this repo, and the command that settles
each. Run the command; do not reason from memory.

| Claim class | Verify with |
|---|---|
| Script names (`bun <x>`) | `bun run --silent 2>&1 \| head -40`, or read `"scripts"` in `package.json` |
| Script *composition* (what `system-check` runs) | read the script value; `bun run --sequential` chains nest |
| Path aliases | `grep -A25 'alias' vite.config.ts` **and** `grep -A25 '"paths"' tsconfig.json` |
| Styling system | `git ls-files \| grep -cE '\.scss$'` vs `git ls-files \| grep -c 'module\.css$'` |
| Token file location | `ls src/styles/` |
| Global ambient types | `grep -n '^type' src/types/global.d.ts` |
| Asset module declarations | `cat src/vite-env.d.ts` |
| A file "exists" / "is duplicated" | `ls <path>` or `git ls-files <path>` |
| Git hook steps | `cat .husky/pre-commit .husky/pre-push` |
| CI steps | `cat .github/workflows/*.yml` |
| Test co-location shape | `git ls-files src \| grep '\.test\.' \| head` |
| A dependency being "wired in" | `grep '<pkg>' package.json` — a `declare module` shim is **not** an install |

## The Two Instruction Files

`CLAUDE.md` and `AGENTS.md` are **not** copies of one another and must not be merged:

- `CLAUDE.md` — *policy*. How to write code here: TypeScript rules, CSS approach,
  accessibility bar, commit conventions. Mostly aspirational claims.
- `AGENTS.md` — *description*. What this codebase **is**: commands, architecture,
  data flow, aliases, enforced formatting. Almost entirely factual claims, so it
  carries the higher drift risk and deserves the closer audit.

They overlap on tooling commands. When both name a script, both get fixed.

## Procedure

1. **Inventory the claims.** Read the doc and mark every sentence that asserts a fact
   about the repo as it exists. Ignore policy statements.
2. **Run the command for each class** from the table above. Batch them; it's a handful
   of `grep`s.
3. **Fix the doc to match the repo** — not the other way around. The exception is when
   the *code* is wrong (a stale comment, a dead file); then fix the code and say so in
   the commit body.
4. **Prefer claims that can't rot.** "Aliases are declared in `vite.config.ts` and
   `tsconfig.json` and must stay in sync" survives; an enumerated list of 18 aliases
   does not. Point at the source of truth instead of copying it.
5. **Re-read the whole doc once more.** Drift clusters — a file that got one thing wrong
   usually got its neighbours wrong too.

## Rot-Resistant Phrasing

| Rots | Survives |
|---|---|
| "Aliases: `@App`, `@app`, `@data/*`, `@state/*`" | "Aliases live in `vite.config.ts` + `tsconfig.json` `paths`; both must be edited together" |
| "`bun system-check` runs format, lint, test, build sequentially" | "`bun system-check` — see its definition in `package.json`" |
| "Types are `Experience`, `Award`, `Language`, `Data`" | "Ambient resume types live in `src/types/global.d.ts`" |
| "styled with SCSS" | "styled with CSS Modules (`*.module.css`)" — a system, not a list |

Enumerate only when the list is short, stable, and load-bearing.

## Red Flags

| Thought | Reality |
|---|---|
| "The doc says SCSS, so I'll write SCSS" | Check the tree first. The doc may be stale; the tree is not. |
| "I'll add the new alias to `tsconfig.json` only" | Both files. Runtime resolution and type resolution are separate. |
| "The doc lists the scripts, no need to open `package.json`" | The listed names are exactly what goes stale. |
| "I renamed a script; docs are a follow-up" | Same commit. A rename that leaves the doc behind *is* the drift. |
| "`declare module '@svgr/rollup'` means svgr is installed" | It means someone silenced a type error. Check `package.json`. |
| "I'll copy the alias list into the doc so readers don't have to look" | You just created the next stale list. Point at the source. |
| "Both docs say the same thing, I'll consolidate" | They have different jobs. Fix both; merge neither. |

## Pre-Commit Checklist

- [ ] Every script name named in a doc exists in `package.json`
- [ ] Every file path named in a doc resolves (`ls` it)
- [ ] Styling-system claims match `git ls-files` counts
- [ ] Alias claims either match both config files or point at them instead of listing
- [ ] Ambient-type claims match `src/types/global.d.ts`
- [ ] Hook/CI step claims match `.husky/*` and `.github/workflows/*.yml`
- [ ] Any code comment the change proved wrong is fixed in the same commit
