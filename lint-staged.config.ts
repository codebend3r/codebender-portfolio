import { defineConfig } from "lint-staged/config"

// Staged-file tasks for the lefthook pre-commit hook (`bun run format:staged`).
// Mirrors the CI gates (`format:check`, `lint`, `spellcheck`) on just the
// staged files, so a bad commit fails locally instead of in CI.
//
// `format:staged` passes `--concurrent false`: globs run top to bottom, one at
// a time, so the read-only checks at the bottom (whose globs overlap the ones
// above) never read a file while a fixer is rewriting it.

// oxfmt exits 2 when every file it receives is in its `ignorePatterns`
// (`.claude/**`, `.vscode/**`, `netlify.toml`, ...), which would block a
// commit that only touches those files.
const oxfmt = "oxfmt --no-error-on-unmatched-pattern"

export default defineConfig({
  // Lint fixes run before oxfmt so the formatter has the final say on layout.
  "*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}": ["oxlint --fix", oxfmt],
  "*.css": ["gale --fix", oxfmt],
  // Every other file type `format:check` enforces.
  "*.{json,md,yml,yaml,toml,html}": oxfmt,
  ".github/workflows/*.{yml,yaml}": "github-actionlint",
  // `--force-exclude` applies `_typos.toml` excludes to the explicit paths.
  "*": "typos --force-exclude",
})
