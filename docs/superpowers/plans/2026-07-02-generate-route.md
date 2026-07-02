# `/generate` AI Resume Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A hidden `/generate` route where the user pastes a job posting (text or image); a Netlify function calls Claude to produce a tailored resume `Data`, saved as a hashed, named variation editable in `/edit-resume`.

**Architecture:** Client page (drop area + password) → `POST /.netlify/functions/generate` (holds `ANTHROPIC_API_KEY`, structured output guarantees valid `Data`) → result saved via the existing `useVariations` store with new `hash`/`sourcePreview`/`origin` metadata → navigate to `/edit-resume`. Spec: `docs/superpowers/specs/2026-07-02-generate-route-design.md`.

**Tech Stack:** Vite + React 19 + TypeScript, Zustand (`persist`), Vitest + Testing Library, Netlify Functions v2 (`Request`/`Response`), `@anthropic-ai/sdk`.

## Global Constraints

- Package manager is **bun**; production build is `bun run build` (never `bun build`).
- Prettier: no semicolons, double quotes, 2-space indent, `printWidth: 80`. Pre-commit runs `prettier:check → ts:check → lint → test` and **fails** on any violation. Run `bun prettier` before committing.
- ESLint enforces `@typescript-eslint/consistent-type-imports` — type-only imports must use `import type`.
- Vitest has `globals: false` — always `import { describe, it, expect, beforeEach, vi } from "vitest"`.
- Spacing convention: **no CSS margins** — parent `display: grid` + `gap`.
- Data types (`Data`, `Variation`, …) are **global ambient types** in `src/types/global.d.ts` — referenced without import.
- Aliased imports everywhere in `src/` (never relative when an alias exists). Exception (called out in Task 4): `netlify/functions/` uses relative imports because Netlify's esbuild bundler does not resolve the app's Vite aliases.
- Commit messages: `CJR: ` prefix, lowercase imperative, bullets, backticked identifiers, **no AI attribution of any kind**.
- Claude call: `claude-opus-4-8`, `output_config: { effort: "medium" }`, no `thinking` param, `max_tokens: 8000`, non-streaming, structured output via `output_config.format` (json_schema).
- Never mutate `src/data/resume.json` or the public `/` page.

## File Structure

```
netlify/functions/generate.mts     # HTTP handler (thin)
netlify/functions/prompt.ts        # pure helpers: schema, prompts, password, request parsing
netlify/functions/prompt.test.ts   # unit tests for the pure helpers
netlify/functions/tsconfig.json    # Node-ish TS config for the functions dir
netlify.toml                       # functions directory + esbuild
.env.example                       # ANTHROPIC_API_KEY / GENERATE_PASSWORD docs
src/utils/routeFor.ts (+test)      # extracted route mapping incl. "generate"
src/utils/navigate.ts              # window.location.assign wrapper (mockable)
src/utils/hashInput.ts (+test)     # SHA-256 content hash (12-hex)
src/generate/GenerateApp.tsx (+test, +module.css)    # page root
src/generate/DropArea.tsx (+test, +module.css)       # text/image input surface
src/generate/GeneratePreview.tsx (+test, +module.css)# read-only result preview
src/generate/useGenerate.ts (+test)                  # fetch hook
src/state/useVariations.ts         # extended: meta + findByHash
src/types/global.d.ts              # Variation fields + Generate* types
src/Entry.tsx                      # third route branch
vite.config.ts / vitest.config.ts / tsconfig.json / .prettierrc.mjs  # @generate alias
package.json                       # dep + ts:check extension
```

---

### Task 1: Config plumbing — alias, deps, netlify config, functions tsconfig

**Files:**

- Modify: `vite.config.ts` (alias block, lines 38–52)
- Modify: `vitest.config.ts` (alias block + `test.include`)
- Modify: `tsconfig.json` (`paths`)
- Modify: `.prettierrc.mjs` (`importOrder`)
- Modify: `package.json` (`ts:check` script + dependency)
- Create: `netlify.toml`
- Create: `netlify/functions/tsconfig.json`
- Create: `.env.example`
- Modify: `.gitignore` (ensure `.env` ignored)

**Interfaces:**

- Consumes: nothing.
- Produces: `@generate/*` alias usable in `src/`; `bun ts:check` covers `netlify/functions/`; vitest runs `netlify/functions/**/*.test.ts`; `@anthropic-ai/sdk` installed.

- [ ] **Step 1: Install the SDK**

```bash
bun add @anthropic-ai/sdk
```

- [ ] **Step 2: Add the `@generate` alias in all four sync points**

In `vite.config.ts` `resolve.alias`, after the `"@edit"` line:

```ts
      "@generate": path.resolve(__dirname, "src/generate"),
```

In `vitest.config.ts` `resolve.alias`, after the `"@edit"` line:

```ts
      "@generate": path.resolve(__dirname, "src/generate"),
```

In `tsconfig.json` `compilerOptions.paths`, after the `"@edit/*"` entry:

```json
      "@generate/*": ["./src/generate/*"],
```

In `.prettierrc.mjs` `importOrder`, after the `"^@edit/(.*)$"` entry:

```js
    "^@generate/(.*)$",
```

- [ ] **Step 3: Make vitest pick up function tests**

In `vitest.config.ts`, replace the `include` line:

```ts
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "netlify/functions/**/*.test.ts",
    ],
```

- [ ] **Step 4: Extend `ts:check` to cover the functions project**

In `package.json` scripts:

```json
    "ts:check": "tsc && tsc -p netlify/functions",
```

- [ ] **Step 5: Create `netlify/functions/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["./**/*.ts", "./**/*.mts", "../../src/types/global.d.ts"]
}
```

(`global.d.ts` is included so the ambient `Data`/`GenerateInput` types exist in the functions project too. No DOM lib — this is server code.)

- [ ] **Step 6: Create `netlify.toml`** (functions only — build settings stay in the Netlify UI so we don't override the existing deploy)

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

- [ ] **Step 7: Create `.env.example`**

```
# Netlify function secrets — set these in the Netlify UI for deploys,
# and in a local .env for `netlify dev`. NEVER commit a real .env.
ANTHROPIC_API_KEY=sk-ant-...
GENERATE_PASSWORD=choose-a-strong-owner-password
```

- [ ] **Step 8: Ensure `.env` is git-ignored**

Check `.gitignore`; if `.env` is absent, append:

```
.env
```

- [ ] **Step 9: Verify**

Run: `bun ts:check && bun run test`
Expected: both pass (functions project has no files yet besides the shared d.ts — `tsc -p` succeeds on empty match is an error, so if `tsc -p netlify/functions` errors with "No inputs were found", that's expected until Task 4; in that case temporarily verify with `tsc` only and re-verify in Task 4. Alternatively create `netlify/functions/prompt.ts` as an empty `export {}` placeholder now and let Task 4 fill it.)

Create the placeholder so the whole chain is green now — `netlify/functions/prompt.ts`:

```ts
export {}
```

Run: `bun ts:check && bun run test`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
bun prettier
git add -A
git commit -m "$(cat <<'EOF'
CJR: add `@generate` alias and netlify functions plumbing

- `@generate` alias in `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.prettierrc.mjs`
- `netlify.toml` functions dir with `esbuild` bundler
- `netlify/functions/tsconfig.json` + `ts:check` covers functions project
- vitest `include` picks up `netlify/functions/**/*.test.ts`
- add `@anthropic-ai/sdk`; document env vars in `.env.example`
EOF
)"
```

---

### Task 2: Types + `hashInput` utility

**Files:**

- Modify: `src/types/global.d.ts`
- Create: `src/utils/hashInput.ts`
- Test: `src/utils/hashInput.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: ambient types `GenerateInput`, `GenerateRequest`, `GenerateResponse`, `VariationMeta`, extended `Variation`; `hashInput(input: GenerateInput): Promise<string>` (12-char lowercase hex).

- [ ] **Step 1: Extend `src/types/global.d.ts`**

Replace the `Variation` type and append the generate types at the end of the file:

```ts
type VariationMeta = {
  hash?: string // stable content id of the generating input
  sourcePreview?: string // memory aid: what the input was
  origin?: "manual" | "generated"
}

type Variation = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: Data
} & VariationMeta

type GenerateInput =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; dataBase64: string }

type GenerateRequest = { password: string; input: GenerateInput }

type GenerateResponse = { data: Data; suggestedName: string }
```

- [ ] **Step 2: Write the failing test** — `src/utils/hashInput.test.ts`

```ts
import { beforeAll, describe, expect, it } from "vitest"

import { hashInput } from "@utils/hashInput"

beforeAll(async () => {
  // jsdom lacks crypto.subtle; use Node's webcrypto implementation
  if (!globalThis.crypto?.subtle) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

describe("hashInput", () => {
  it("is deterministic for the same text", async () => {
    const a = await hashInput({ type: "text", text: "senior frontend role" })
    const b = await hashInput({ type: "text", text: "senior frontend role" })
    expect(a).toBe(b)
  })

  it("normalizes surrounding whitespace in text", async () => {
    const a = await hashInput({ type: "text", text: "  posting  " })
    const b = await hashInput({ type: "text", text: "posting" })
    expect(a).toBe(b)
  })

  it("returns a 12-char lowercase hex id", async () => {
    const h = await hashInput({ type: "text", text: "x" })
    expect(h).toMatch(/^[0-9a-f]{12}$/)
  })

  it("differs across different inputs", async () => {
    const a = await hashInput({ type: "text", text: "one" })
    const b = await hashInput({ type: "text", text: "two" })
    expect(a).not.toBe(b)
  })

  it("hashes image inputs on their base64 payload", async () => {
    const img = (data: string): GenerateInput => ({
      type: "image",
      mediaType: "image/png",
      dataBase64: data,
    })
    const a = await hashInput(img("AAAA"))
    const b = await hashInput(img("AAAA"))
    const c = await hashInput(img("BBBB"))
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it("text and image inputs with equal payloads do not collide", async () => {
    const a = await hashInput({ type: "text", text: "AAAA" })
    const b = await hashInput({
      type: "image",
      mediaType: "image/png",
      dataBase64: "AAAA",
    })
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test:watch` is not needed — run `bunx vitest run src/utils/hashInput.test.ts`
Expected: FAIL — cannot resolve `@utils/hashInput`

- [ ] **Step 4: Implement `src/utils/hashInput.ts`**

```ts
/**
 * Stable content hash of a generation input.
 *
 * Same input → same hash, used by /generate to dedupe variations.
 * SHA-256 over a normalized string, truncated to 12 hex chars.
 */
export async function hashInput(input: GenerateInput): Promise<string> {
  const normalized =
    input.type === "text"
      ? `text:${input.text.trim()}`
      : `image:${input.dataBase64}`
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bunx vitest run src/utils/hashInput.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
bun prettier
git add src/types/global.d.ts src/utils/hashInput.ts src/utils/hashInput.test.ts
git commit -m "$(cat <<'EOF'
CJR: add `hashInput` util and generate/variation meta types

- `VariationMeta` (`hash`, `sourcePreview`, `origin`) merged into `Variation`
- ambient `GenerateInput` / `GenerateRequest` / `GenerateResponse`
- `hashInput` SHA-256 12-hex content id, whitespace-normalized text
EOF
)"
```

---

### Task 3: `useVariations` — meta on create + `findByHash`

**Files:**

- Modify: `src/state/useVariations.ts`
- Test: `src/state/useVariations.test.ts` (extend)

**Interfaces:**

- Consumes: `Variation`/`VariationMeta` ambient types (Task 2).
- Produces: `createVariation(name: string, data: Data, meta?: VariationMeta): string`; `findByHash(hash: string): Variation | undefined`. Existing two-arg callers (`EditResumeApp`) keep working unchanged.

- [ ] **Step 1: Add failing tests** — append inside the `describe("useVariations", …)` block of `src/state/useVariations.test.ts`:

```ts
it("stores meta on create when provided", () => {
  const id = useVariations.getState().createVariation("Gen", base(), {
    hash: "abc123def456",
    sourcePreview: "Senior Frontend Engineer at Achievers…",
    origin: "generated",
  })
  const v = useVariations.getState().variations.find((x) => x.id === id)!
  expect(v.hash).toBe("abc123def456")
  expect(v.sourcePreview).toBe("Senior Frontend Engineer at Achievers…")
  expect(v.origin).toBe("generated")
})

it("createVariation without meta stays backward-compatible", () => {
  const id = useVariations.getState().createVariation("Plain", base())
  const v = useVariations.getState().variations.find((x) => x.id === id)!
  expect(v.hash).toBeUndefined()
  expect(v.origin).toBeUndefined()
})

it("findByHash returns the matching variation or undefined", () => {
  useVariations.getState().createVariation("Gen", base(), { hash: "aaa" })
  expect(useVariations.getState().findByHash("aaa")?.name).toBe("Gen")
  expect(useVariations.getState().findByHash("zzz")).toBeUndefined()
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bunx vitest run src/state/useVariations.test.ts`
Expected: FAIL — `findByHash` is not a function / meta fields undefined

- [ ] **Step 3: Implement in `src/state/useVariations.ts`**

Update the state type and the two touched members:

```ts
type VariationsState = {
  variations: Variation[]
  activeId: string | null
  createVariation: (name: string, data: Data, meta?: VariationMeta) => string
  renameVariation: (id: string, name: string) => void
  deleteVariation: (id: string) => void
  selectVariation: (id: string | null) => void
  saveActive: (data: Data) => void
  findByHash: (hash: string) => Variation | undefined
}
```

```ts
      createVariation: (name, data, meta) => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const variation: Variation = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          data: structuredClone(data),
          ...meta,
        }
        set({ variations: [...get().variations, variation], activeId: id })
        return id
      },
```

And add after `saveActive`:

```ts
      findByHash: (hash) => get().variations.find((v) => v.hash === hash),
```

- [ ] **Step 4: Run full state tests**

Run: `bunx vitest run src/state/`
Expected: PASS (all existing + 3 new)

- [ ] **Step 5: Commit**

```bash
bun prettier
git add src/state/useVariations.ts src/state/useVariations.test.ts
git commit -m "$(cat <<'EOF'
CJR: extend `useVariations` with meta and `findByHash`

- `createVariation` accepts optional `VariationMeta` (`hash`/`sourcePreview`/`origin`)
- `findByHash` selector for `/generate` dedupe
- two-arg callers unchanged
EOF
)"
```

---

### Task 4: Netlify function pure helpers — `prompt.ts`

**Files:**

- Modify: `netlify/functions/prompt.ts` (replace the placeholder)
- Test: `netlify/functions/prompt.test.ts`

**Interfaces:**

- Consumes: ambient `Data`, `GenerateInput`, `GenerateRequest` (functions tsconfig includes `global.d.ts`).
- Produces: `validatePassword(provided: string, expected: string): boolean`; `parseGenerateRequest(body: unknown): GenerateRequest | null`; `buildSystemPrompt(base: Data): string`; `buildUserContent(input: GenerateInput): Array<object>`; `WRAPPER_SCHEMA` (JSON Schema for `{ resume, suggestedName }`).

Note: this file uses **relative imports** and no Vite aliases — Netlify's esbuild bundles from `netlify/functions/` and does not know the app's alias map. This is the one sanctioned exception to the alias rule.

- [ ] **Step 1: Write the failing tests** — `netlify/functions/prompt.test.ts`

```ts
import { describe, expect, it } from "vitest"

import resume from "../../src/data/resume.json"
import {
  WRAPPER_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  parseGenerateRequest,
  validatePassword,
} from "./prompt"

describe("validatePassword", () => {
  it("accepts a matching password", () => {
    expect(validatePassword("hunter2", "hunter2")).toBe(true)
  })

  it("rejects a wrong password", () => {
    expect(validatePassword("nope", "hunter2")).toBe(false)
  })

  it("rejects when the expected password is unset/empty", () => {
    expect(validatePassword("", "")).toBe(false)
    expect(validatePassword("anything", "")).toBe(false)
  })
})

describe("parseGenerateRequest", () => {
  it("accepts a valid text request", () => {
    const req = parseGenerateRequest({
      password: "p",
      input: { type: "text", text: "job posting" },
    })
    expect(req?.input.type).toBe("text")
  })

  it("accepts a valid image request", () => {
    const req = parseGenerateRequest({
      password: "p",
      input: { type: "image", mediaType: "image/png", dataBase64: "AAAA" },
    })
    expect(req?.input.type).toBe("image")
  })

  it("rejects malformed bodies", () => {
    expect(parseGenerateRequest(null)).toBeNull()
    expect(parseGenerateRequest({})).toBeNull()
    expect(parseGenerateRequest({ password: "p" })).toBeNull()
    expect(
      parseGenerateRequest({ password: "p", input: { type: "text" } })
    ).toBeNull()
    expect(
      parseGenerateRequest({ password: 1, input: { type: "text", text: "x" } })
    ).toBeNull()
  })

  it("rejects oversized payloads", () => {
    expect(
      parseGenerateRequest({
        password: "p",
        input: { type: "text", text: "x".repeat(50_001) },
      })
    ).toBeNull()
    expect(
      parseGenerateRequest({
        password: "p",
        input: {
          type: "image",
          mediaType: "image/png",
          dataBase64: "A".repeat(5_000_001),
        },
      })
    ).toBeNull()
  })
})

describe("buildSystemPrompt", () => {
  it("embeds the base resume and the ground-truth rules", () => {
    const prompt = buildSystemPrompt(resume as Data)
    expect(prompt).toContain(resume.name)
    expect(prompt.toLowerCase()).toContain("never invent")
    expect(prompt).toContain("suggestedName")
  })
})

describe("buildUserContent", () => {
  it("wraps text input as a text block", () => {
    const blocks = buildUserContent({ type: "text", text: "the posting" })
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: "text" })
  })

  it("wraps image input as an image block plus instruction", () => {
    const blocks = buildUserContent({
      type: "image",
      mediaType: "image/png",
      dataBase64: "AAAA",
    })
    expect(blocks[0]).toMatchObject({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "AAAA" },
    })
    expect(blocks[1]).toMatchObject({ type: "text" })
  })
})

describe("WRAPPER_SCHEMA", () => {
  it("requires resume and suggestedName with no extra props", () => {
    expect(WRAPPER_SCHEMA.required).toEqual(["resume", "suggestedName"])
    expect(WRAPPER_SCHEMA.additionalProperties).toBe(false)
  })

  it("mirrors every top-level Data key", () => {
    const dataKeys = Object.keys(resume).sort()
    const schemaKeys = Object.keys(
      WRAPPER_SCHEMA.properties.resume.properties
    ).sort()
    expect(schemaKeys).toEqual(dataKeys)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bunx vitest run netlify/functions/prompt.test.ts`
Expected: FAIL — exports missing

- [ ] **Step 3: Implement `netlify/functions/prompt.ts`**

```ts
// Pure helpers for the /generate function. Keep this file free of the
// Anthropic SDK and of any I/O so it stays unit-testable.
//
// NOTE: relative imports on purpose — Netlify's esbuild bundler does not
// resolve the app's Vite aliases.
import { createHash, timingSafeEqual } from "node:crypto"

const MAX_TEXT_CHARS = 50_000
const MAX_IMAGE_BASE64_CHARS = 5_000_000 // ~3.5MB binary, under Netlify's 6MB body cap

/** Constant-time password check; always false when no password is configured. */
export function validatePassword(provided: string, expected: string): boolean {
  if (!expected) return false
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export function parseGenerateRequest(body: unknown): GenerateRequest | null {
  if (typeof body !== "object" || body === null) return null
  const { password, input } = body as Record<string, unknown>
  if (typeof password !== "string") return null
  if (typeof input !== "object" || input === null) return null
  const candidate = input as Record<string, unknown>

  if (candidate.type === "text") {
    if (typeof candidate.text !== "string") return null
    if (candidate.text.length === 0 || candidate.text.length > MAX_TEXT_CHARS)
      return null
    return { password, input: { type: "text", text: candidate.text } }
  }

  if (candidate.type === "image") {
    if (typeof candidate.mediaType !== "string") return null
    if (typeof candidate.dataBase64 !== "string") return null
    if (
      candidate.dataBase64.length === 0 ||
      candidate.dataBase64.length > MAX_IMAGE_BASE64_CHARS
    )
      return null
    return {
      password,
      input: {
        type: "image",
        mediaType: candidate.mediaType,
        dataBase64: candidate.dataBase64,
      },
    }
  }

  return null
}

export function buildSystemPrompt(base: Data): string {
  return [
    "You tailor CJ Rivas's resume to a specific job posting.",
    "",
    "Below is CJ's REAL resume — the only source of truth about his",
    "experience, employers, dates, education, and awards:",
    "",
    JSON.stringify(base, null, 2),
    "",
    "Rules:",
    "- Reorder and re-emphasize existing content to fit the target role.",
    "- Rewrite the summary, title, and technical_skills selection/order for",
    "  relevance to the posting.",
    "- Rephrase achievement bullets to foreground relevant impact.",
    "- NEVER invent employers, roles, dates, technologies, awards, or any",
    "  fact not present in the resume above.",
    "- Keep the same JSON shape as the resume above.",
    "- Keep `skill_descriptions` aligned index-for-index with",
    "  `technical_skills`.",
    "- Also produce `suggestedName`: a short label for this variation such",
    '  as "Senior Frontend Engineer @ Achievers" (role @ company from the',
    "  posting).",
  ].join("\n")
}

export function buildUserContent(input: GenerateInput) {
  if (input.type === "text") {
    return [
      {
        type: "text" as const,
        text: `Tailor the resume for this job posting:\n\n${input.text}`,
      },
    ]
  }
  return [
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: input.mediaType,
        data: input.dataBase64,
      },
    },
    {
      type: "text" as const,
      text: "The image above is the job posting. Tailor the resume for it.",
    },
  ]
}

// ---------------------------------------------------------------------------
// JSON Schema for structured output. Mirrors `Data` in src/types/global.d.ts
// — keep the two in sync when the resume shape changes.
// ---------------------------------------------------------------------------

const str = { type: "string" } as const
const strArray = { type: "array", items: str } as const

const DATA_SCHEMA = {
  type: "object",
  properties: {
    name: str,
    contact: {
      type: "array",
      items: {
        type: "object",
        properties: { label: str, value: str },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    title: str,
    summary: str,
    technical_skills: strArray,
    skill_descriptions: strArray,
    work_experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: str,
          company: str,
          period: str,
          achievements: strArray,
        },
        required: ["role", "company", "period", "achievements"],
        additionalProperties: false,
      },
    },
    awards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: str,
          organization: str,
          year: { type: "integer" },
        },
        required: ["name", "organization", "year"],
        additionalProperties: false,
      },
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: { name: str, proficiency: str },
        required: ["name", "proficiency"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: { program: str, institution: str, details: str },
        required: ["program", "institution"],
        additionalProperties: false,
      },
    },
    showcase: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: str,
          domain: str,
          url: str,
          role: str,
          period: str,
          description: str,
          image: str,
          tags: strArray,
        },
        required: [
          "name",
          "domain",
          "url",
          "role",
          "period",
          "description",
          "image",
          "tags",
        ],
        additionalProperties: false,
      },
    },
  },
  required: [
    "name",
    "contact",
    "title",
    "summary",
    "technical_skills",
    "skill_descriptions",
    "work_experience",
    "awards",
    "languages",
    "education",
    "showcase",
  ],
  additionalProperties: false,
} as const

export const WRAPPER_SCHEMA = {
  type: "object",
  properties: {
    resume: DATA_SCHEMA,
    suggestedName: str,
  },
  required: ["resume", "suggestedName"],
  additionalProperties: false,
} as const
```

- [ ] **Step 4: Run to verify pass**

Run: `bunx vitest run netlify/functions/prompt.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
bun prettier
git add netlify/functions/prompt.ts netlify/functions/prompt.test.ts
git commit -m "$(cat <<'EOF'
CJR: add pure prompt helpers for `/generate` function

- `validatePassword` constant-time compare, false when unset
- `parseGenerateRequest` shape + size validation
- `buildSystemPrompt` embeds base `resume.json` with never-invent rules
- `buildUserContent` text/image (vision) blocks
- `WRAPPER_SCHEMA` mirrors `Data` for structured output
EOF
)"
```

---

### Task 5: Netlify function handler — `generate.mts`

**Files:**

- Create: `netlify/functions/generate.mts`

**Interfaces:**

- Consumes: everything from `./prompt` (Task 4); env `ANTHROPIC_API_KEY`, `GENERATE_PASSWORD`.
- Produces: `POST /.netlify/functions/generate` → `200 {data, suggestedName}` | `400` | `401` | `405` | `502`. The client hook (Task 7) relies on these status codes.

The handler is deliberately thin — all logic that can be unit-tested lives in `prompt.ts`. The handler itself is verified manually with `netlify dev` (Task 10).

- [ ] **Step 1: Implement `netlify/functions/generate.mts`**

```ts
import Anthropic from "@anthropic-ai/sdk"

import resume from "../../src/data/resume.json"
import {
  WRAPPER_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  parseGenerateRequest,
  validatePassword,
} from "./prompt"

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json(405, { error: "method not allowed" })

  const body = await req.json().catch(() => null)
  const parsed = parseGenerateRequest(body)
  if (!parsed) return json(400, { error: "invalid request" })

  if (!validatePassword(parsed.password, process.env.GENERATE_PASSWORD ?? "")) {
    return json(401, { error: "unauthorized" })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    // Fast config on purpose: grounded rewrite, not deep reasoning, and
    // Netlify sync functions have a ~10s budget. See the design spec.
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: WRAPPER_SCHEMA },
      },
      system: buildSystemPrompt(resume as Data),
      messages: [
        {
          role: "user",
          content: buildUserContent(
            parsed.input
          ) as Anthropic.ContentBlockParam[],
        },
      ],
    })

    const text = response.content.find((b) => b.type === "text")?.text
    if (!text) return json(502, { error: "empty model response" })

    const { resume: data, suggestedName } = JSON.parse(text) as {
      resume: Data
      suggestedName: string
    }
    return json(200, { data, suggestedName } satisfies GenerateResponse)
  } catch (err) {
    console.error("generate failed:", err instanceof Error ? err.message : err)
    return json(502, { error: "generation failed" })
  }
}
```

If the installed SDK version does not yet type `output_config.format`, check `node_modules/@anthropic-ai/sdk` for the current parameter name before resorting to a cast — do not silently drop the schema.

- [ ] **Step 2: Verify types + lint**

Run: `bun ts:check && bun lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
bun prettier
git add netlify/functions/generate.mts
git commit -m "$(cat <<'EOF'
CJR: add `/generate` netlify function handler

- validates method, body shape, owner password (`401`)
- calls `claude-opus-4-8` with structured output `WRAPPER_SCHEMA`
- fast config (`effort: medium`, no thinking) for netlify sync budget
- returns `{data, suggestedName}`; `502` on model/parse failure
EOF
)"
```

---

### Task 6: Routing — `routeFor` util, `navigate` util, `Entry` branch

**Files:**

- Create: `src/utils/routeFor.ts`
- Create: `src/utils/navigate.ts`
- Test: `src/utils/routeFor.test.ts`
- Modify: `src/Entry.tsx`

**Interfaces:**

- Consumes: `GenerateApp` placeholder — create `src/generate/GenerateApp.tsx` as a minimal stub in this task; Task 9 replaces it.
- Produces: `type Route = "generate" | "edit" | "app"`, `routeFor(pathname: string): Route`, `navigate(path: string): void`. Tasks 8–9 mock `@utils/navigate`.

- [ ] **Step 1: Write the failing test** — `src/utils/routeFor.test.ts`

```ts
import { describe, expect, it } from "vitest"

import { routeFor } from "@utils/routeFor"

describe("routeFor", () => {
  it("maps /edit-resume to edit", () => {
    expect(routeFor("/edit-resume")).toBe("edit")
  })

  it("maps /generate to generate", () => {
    expect(routeFor("/generate")).toBe("generate")
  })

  it("maps everything else to app", () => {
    expect(routeFor("/")).toBe("app")
    expect(routeFor("/anything")).toBe("app")
    expect(routeFor("/generate/extra")).toBe("app")
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bunx vitest run src/utils/routeFor.test.ts`
Expected: FAIL — cannot resolve `@utils/routeFor`

- [ ] **Step 3: Implement**

`src/utils/routeFor.ts`:

```ts
export type Route = "generate" | "edit" | "app"

export function routeFor(pathname: string): Route {
  if (pathname === "/edit-resume") return "edit"
  if (pathname === "/generate") return "generate"
  return "app"
}
```

`src/utils/navigate.ts`:

```ts
/** Thin wrapper so components can navigate without touching window.location
 *  directly — tests mock this module (jsdom cannot spy on location.assign). */
export function navigate(path: string): void {
  window.location.assign(path)
}
```

`src/generate/GenerateApp.tsx` (stub — Task 9 replaces it):

```tsx
export default function GenerateApp() {
  return <main>generate</main>
}
```

- [ ] **Step 4: Rewrite `src/Entry.tsx`**

```tsx
import React from "react"

import App from "@App"
import ReactDOM from "react-dom/client"

import EditResumeApp from "@edit/EditResumeApp"

import GenerateApp from "@generate/GenerateApp"

import { applySky } from "@sky"

import { routeFor } from "@utils/routeFor"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

const rootEl = document.getElementById("root")

if (rootEl) {
  const route = routeFor(window.location.pathname)
  if (route === "app") applySky()

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      {route === "edit" ? (
        <EditResumeApp />
      ) : route === "generate" ? (
        <GenerateApp />
      ) : (
        <App />
      )}
    </React.StrictMode>
  )
}
```

Check for existing imports of `routeFor` from `Entry`: `grep -rn "from \"@app/Entry\"\|routeFor" src/ --include="*.ts*" | grep -v utils/routeFor`. If any test imports `routeFor` from `Entry`, update it to `@utils/routeFor`.

- [ ] **Step 5: Run the full suite**

Run: `bun run test && bun ts:check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
bun prettier
git add src/utils/routeFor.ts src/utils/routeFor.test.ts src/utils/navigate.ts src/generate/GenerateApp.tsx src/Entry.tsx
git commit -m "$(cat <<'EOF'
CJR: add `/generate` route branch in `Entry`

- extract `routeFor` to `@utils/routeFor` with `generate` route
- `navigate` wrapper for mockable `window.location.assign`
- `applySky` only on the public `app` route
- `GenerateApp` stub mounted on `/generate`
EOF
)"
```

---

### Task 7: `useGenerate` hook

**Files:**

- Create: `src/generate/useGenerate.ts`
- Test: `src/generate/useGenerate.test.ts`

**Interfaces:**

- Consumes: `GenerateRequest`/`GenerateResponse` ambient types; `fetch` to `/.netlify/functions/generate` (Task 5's status codes).
- Produces:

```ts
type GenerateStatus = "idle" | "generating" | "done" | "error"
useGenerate(): {
  status: GenerateStatus
  result: GenerateResponse | null
  error: string | null
  generate: (req: GenerateRequest) => Promise<void>
  reset: () => void
}
```

- [ ] **Step 1: Write the failing test** — `src/generate/useGenerate.test.ts`

```ts
import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useGenerate } from "@generate/useGenerate"

const okBody: GenerateResponse = {
  data: { name: "CJ" } as Data,
  suggestedName: "Frontend @ Acme",
}

function mockFetch(status: number, body: unknown) {
  return vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }))
  )
}

const req: GenerateRequest = {
  password: "p",
  input: { type: "text", text: "posting" },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useGenerate", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useGenerate())
    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
  })

  it("stores the response on success", async () => {
    mockFetch(200, okBody)
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("done")
    expect(result.current.result?.suggestedName).toBe("Frontend @ Acme")
    expect(result.current.error).toBeNull()
  })

  it("surfaces a wrong-password error on 401", async () => {
    mockFetch(401, { error: "unauthorized" })
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/password/i)
  })

  it("surfaces a generic error on 5xx", async () => {
    mockFetch(502, { error: "generation failed" })
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/failed/i)
  })

  it("surfaces a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline")
      })
    )
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
  })

  it("reset returns to idle", async () => {
    mockFetch(200, okBody)
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    act(() => result.current.reset())
    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bunx vitest run src/generate/useGenerate.test.ts`
Expected: FAIL — cannot resolve `@generate/useGenerate`

- [ ] **Step 3: Implement `src/generate/useGenerate.ts`**

```ts
import { useCallback, useState } from "react"

export type GenerateStatus = "idle" | "generating" | "done" | "error"

const ENDPOINT = "/.netlify/functions/generate"

export function useGenerate() {
  const [status, setStatus] = useState<GenerateStatus>("idle")
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (req: GenerateRequest) => {
    setStatus("generating")
    setResult(null)
    setError(null)
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
      })
      if (res.status === 401) {
        setStatus("error")
        setError("Wrong password")
        return
      }
      if (!res.ok) {
        setStatus("error")
        setError("Generation failed — try again")
        return
      }
      const body = (await res.json()) as GenerateResponse
      setResult(body)
      setStatus("done")
    } catch {
      setStatus("error")
      setError("Network error — is the function running?")
    }
  }, [])

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, generate, reset }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bunx vitest run src/generate/useGenerate.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
bun prettier
git add src/generate/useGenerate.ts src/generate/useGenerate.test.ts
git commit -m "$(cat <<'EOF'
CJR: add `useGenerate` hook for the `/generate` function call

- `idle`/`generating`/`done`/`error` states
- `401` maps to wrong-password message; 5xx/network to generic errors
EOF
)"
```

---

### Task 8: `DropArea` component

**Files:**

- Create: `src/generate/DropArea.tsx`
- Create: `src/generate/DropArea.module.css`
- Test: `src/generate/DropArea.test.tsx`

**Interfaces:**

- Consumes: ambient `GenerateInput`.
- Produces:

```tsx
type DropAreaProps = {
  value: GenerateInput | null
  onChange: (input: GenerateInput | null) => void
  onError: (message: string) => void
}
export function DropArea(props: DropAreaProps): JSX.Element
```

Behavior: textarea for text (typing or pasting emits `{type:"text"}`); pasting or dropping an image file emits `{type:"image"}` after base64 encoding; images over `MAX_IMAGE_BYTES = 3_500_000` call `onError` and do not emit; when an image is selected show its name/size and a Clear button that emits `null`.

- [ ] **Step 1: Write the failing test** — `src/generate/DropArea.test.tsx`

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DropArea } from "@generate/DropArea"

function makeImageFile(bytes: number, name = "posting.png"): File {
  return new File([new Uint8Array(bytes)], name, { type: "image/png" })
}

describe("DropArea", () => {
  it("emits a text input when typing into the textarea", () => {
    const onChange = vi.fn()
    render(<DropArea value={null} onChange={onChange} onError={() => {}} />)
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Senior Frontend Engineer" },
    })
    expect(onChange).toHaveBeenCalledWith({
      type: "text",
      text: "Senior Frontend Engineer",
    })
  })

  it("emits null when the textarea is emptied", () => {
    const onChange = vi.fn()
    render(
      <DropArea
        value={{ type: "text", text: "x" }}
        onChange={onChange}
        onError={() => {}}
      />
    )
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } })
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("emits an image input when an image file is dropped", async () => {
    const onChange = vi.fn()
    render(<DropArea value={null} onChange={onChange} onError={() => {}} />)
    fireEvent.drop(screen.getByLabelText(/drop area/i), {
      dataTransfer: { files: [makeImageFile(100)] },
    })
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: "image", mediaType: "image/png" })
      )
    )
  })

  it("rejects oversized images via onError", async () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    render(<DropArea value={null} onChange={onChange} onError={onError} />)
    fireEvent.drop(screen.getByLabelText(/drop area/i), {
      dataTransfer: { files: [makeImageFile(3_500_001)] },
    })
    await waitFor(() => expect(onError).toHaveBeenCalled())
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows the selected image and clears it", () => {
    const onChange = vi.fn()
    render(
      <DropArea
        value={{ type: "image", mediaType: "image/png", dataBase64: "AAAA" }}
        onChange={onChange}
        onError={() => {}}
      />
    )
    expect(screen.getByText(/image attached/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /clear/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bunx vitest run src/generate/DropArea.test.tsx`
Expected: FAIL — cannot resolve `@generate/DropArea`

- [ ] **Step 3: Implement**

`src/generate/DropArea.tsx`:

```tsx
import type React from "react"

import styles from "./DropArea.module.css"

export const MAX_IMAGE_BYTES = 3_500_000

type DropAreaProps = {
  value: GenerateInput | null
  onChange: (input: GenerateInput | null) => void
  onError: (message: string) => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      resolve(url.slice(url.indexOf(",") + 1)) // strip data:*;base64, prefix
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function DropArea({ value, onChange, onError }: DropAreaProps) {
  const acceptImage = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return false
    if (file.size > MAX_IMAGE_BYTES) {
      onError("Image is too large — max ~3.5MB")
      return true
    }
    const dataBase64 = await fileToBase64(file)
    onChange({ type: "image", mediaType: file.type, dataBase64 })
    return true
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    await acceptImage(e.dataTransfer?.files?.[0])
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
      i.type.startsWith("image/")
    )
    if (!item) return // let text paste fall through to the textarea
    e.preventDefault()
    await acceptImage(item.getAsFile() ?? undefined)
  }

  const handleText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    onChange(text ? { type: "text", text } : null)
  }

  return (
    <div
      aria-label="Drop area"
      className={styles.dropArea}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {value?.type === "image" ? (
        <div className={styles.imageBadge}>
          <span>Image attached ({value.mediaType})</span>
          <button type="button" onClick={() => onChange(null)}>
            Clear
          </button>
        </div>
      ) : (
        <textarea
          aria-label="Job posting"
          className={styles.textarea}
          placeholder="Paste the job posting text — or paste/drop a screenshot"
          rows={12}
          value={value?.type === "text" ? value.text : ""}
          onChange={handleText}
        />
      )}
    </div>
  )
}
```

`src/generate/DropArea.module.css`:

```css
.dropArea {
  display: grid;
  gap: 12px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 16px;
  background: var(--panel);
}

.textarea {
  width: 100%;
  resize: vertical;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  outline: none;
}

.imageBadge {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  color: var(--text);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `bunx vitest run src/generate/DropArea.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
bun prettier
git add src/generate/DropArea.tsx src/generate/DropArea.module.css src/generate/DropArea.test.tsx
git commit -m "$(cat <<'EOF'
CJR: add `DropArea` for `/generate` text and image input

- textarea emits text input; paste/drop of images emits base64 image input
- `MAX_IMAGE_BYTES` cap (~3.5MB) surfaces via `onError`
- attached-image badge with clear
EOF
)"
```

---

### Task 9: `GeneratePreview` + full `GenerateApp`

**Files:**

- Create: `src/generate/GeneratePreview.tsx`
- Create: `src/generate/GeneratePreview.module.css`
- Test: `src/generate/GeneratePreview.test.tsx`
- Modify: `src/generate/GenerateApp.tsx` (replace stub)
- Create: `src/generate/GenerateApp.module.css`
- Test: `src/generate/GenerateApp.test.tsx`

**Interfaces:**

- Consumes: `DropArea` (Task 8), `useGenerate` (Task 7), `hashInput` (Task 2), `useVariations.createVariation/findByHash/selectVariation` (Task 3), `navigate` from `@utils/navigate` (Task 6), `useStore.loadData`, existing view-mode section components (`Header`, `Summary`, `TechnicalSkills`, `WorkExperience`, `Awards`, `Languages`, `Education`).
- Produces: the complete `/generate` page. `GeneratePreview` props:

```tsx
type GeneratePreviewProps = {
  data: Data
  name: string
  onNameChange: (name: string) => void
  onConfirm: () => void
  onDiscard: () => void
}
```

Check the exact props of `Header`/`Summary`/etc. in `src/edit/EditResumeApp.tsx` before writing `GeneratePreview` — mirror how the editor mounts them (they render view-mode when no `EditProvider` wraps them).

- [ ] **Step 1: Write the failing preview test** — `src/generate/GeneratePreview.test.tsx`

```tsx
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import { GeneratePreview } from "@generate/GeneratePreview"

import { useStore } from "@state/useStore"

const data = (): Data => ({
  ...(structuredClone(resume) as Data),
  name: "Generated Name",
})

beforeEach(() => {
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("GeneratePreview", () => {
  it("loads the generated data into the store and renders it", () => {
    render(
      <GeneratePreview
        data={data()}
        name="Frontend @ Acme"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    expect(useStore.getState().name).toBe("Generated Name")
  })

  it("edits the variation name", () => {
    const onNameChange = vi.fn()
    render(
      <GeneratePreview
        data={data()}
        name="Frontend @ Acme"
        onNameChange={onNameChange}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    fireEvent.change(screen.getByRole("textbox", { name: /variation name/i }), {
      target: { value: "Renamed" },
    })
    expect(onNameChange).toHaveBeenCalledWith("Renamed")
  })

  it("fires confirm and discard", () => {
    const onConfirm = vi.fn()
    const onDiscard = vi.fn()
    render(
      <GeneratePreview
        data={data()}
        name="N"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        onDiscard={onDiscard}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    fireEvent.click(screen.getByRole("button", { name: /discard/i }))
    expect(onConfirm).toHaveBeenCalled()
    expect(onDiscard).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bunx vitest run src/generate/GeneratePreview.test.tsx`
Expected: FAIL — cannot resolve `@generate/GeneratePreview`

- [ ] **Step 3: Implement `GeneratePreview`**

`src/generate/GeneratePreview.tsx` (mirror the section mounting used in `src/edit/EditResumeApp.tsx` — adjust the section props below to match what you find there):

```tsx
import { useEffect } from "react"

import Awards from "@components/Awards"
import Education from "@components/Education"
import Header from "@components/Header"
import Languages from "@components/Languages"
import Summary from "@components/Summary"
import TechnicalSkills from "@components/TechnicalSkills"
import WorkExperience from "@components/WorkExperience"

import { useStore } from "@state/useStore"

import styles from "./GeneratePreview.module.css"

type GeneratePreviewProps = {
  data: Data
  name: string
  onNameChange: (name: string) => void
  onConfirm: () => void
  onDiscard: () => void
}

export function GeneratePreview({
  data,
  name,
  onNameChange,
  onConfirm,
  onDiscard,
}: GeneratePreviewProps) {
  const loadData = useStore((s) => s.loadData)

  useEffect(() => {
    loadData(structuredClone(data))
  }, [data, loadData])

  return (
    <section className={styles.preview}>
      <div className={styles.controls}>
        <label className={styles.nameLabel}>
          Variation name
          <input
            aria-label="Variation name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </label>
        <button type="button" onClick={onConfirm}>
          Save & edit
        </button>
        <button type="button" onClick={onDiscard}>
          Discard
        </button>
      </div>
      <div className={styles.resume}>
        <Header />
        <Summary index={1} />
        <TechnicalSkills index={2} />
        <WorkExperience index={3} />
        <Awards index={4} />
        <Languages index={5} />
        <Education index={6} />
      </div>
    </section>
  )
}
```

(If the editor passes different props — e.g. `eyebrow` strings — copy those exactly. The invariant: sections render view-mode because there is no `EditProvider`.)

`src/generate/GeneratePreview.module.css`:

```css
.preview {
  display: grid;
  gap: 24px;
}

.controls {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: end;
}

.nameLabel {
  display: grid;
  gap: 6px;
  color: var(--muted);
}

.resume {
  display: grid;
  gap: 32px;
}
```

- [ ] **Step 4: Run preview tests**

Run: `bunx vitest run src/generate/GeneratePreview.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing app test** — `src/generate/GenerateApp.test.tsx`

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import GenerateApp from "@generate/GenerateApp"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

import { navigate } from "@utils/navigate"

vi.mock("@utils/navigate", () => ({ navigate: vi.fn() }))

const okBody: GenerateResponse = {
  data: {
    ...(structuredClone(resume) as Data),
    name: "Generated Name",
  },
  suggestedName: "Frontend @ Acme",
}

beforeAll(async () => {
  if (!globalThis.crypto?.subtle) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
  useStore.getState().loadData(structuredClone(resume) as Data)
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, json: async () => okBody }))
  )
})

async function fillAndGenerate() {
  fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
    target: { value: "Senior Frontend Engineer at Acme" },
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "hunter2" },
  })
  fireEvent.click(screen.getByRole("button", { name: /^generate$/i }))
}

describe("GenerateApp", () => {
  it("generates and shows the preview with the suggested name", async () => {
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: /variation name/i })
      ).toHaveValue("Frontend @ Acme")
    )
  })

  it("saves a variation with hash meta and navigates to the editor", async () => {
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    fireEvent.click(screen.getByRole("button", { name: /save & edit/i }))
    const state = useVariations.getState()
    expect(state.variations).toHaveLength(1)
    expect(state.variations[0].origin).toBe("generated")
    expect(state.variations[0].hash).toMatch(/^[0-9a-f]{12}$/)
    expect(state.variations[0].sourcePreview).toContain("Senior Frontend")
    expect(state.activeId).toBe(state.variations[0].id)
    expect(navigate).toHaveBeenCalledWith("/edit-resume")
  })

  it("offers to open an existing variation when the hash matches", async () => {
    render(<GenerateApp />)
    // Seed a variation whose hash equals the hash of the input we'll paste
    const { hashInput } = await import("@utils/hashInput")
    const hash = await hashInput({
      type: "text",
      text: "Senior Frontend Engineer at Acme",
    })
    useVariations
      .getState()
      .createVariation("Existing", structuredClone(resume) as Data, {
        hash,
        origin: "generated",
      })
    useVariations.getState().selectVariation(null)

    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/already generated/i)).toBeInTheDocument()
    )
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: /open existing/i }))
    expect(navigate).toHaveBeenCalledWith("/edit-resume")
  })

  it("shows the error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "unauthorized" }),
      }))
    )
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/wrong password/i)).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 6: Run to verify failure**

Run: `bunx vitest run src/generate/GenerateApp.test.tsx`
Expected: FAIL — stub has none of this UI

- [ ] **Step 7: Implement `GenerateApp`**

`src/generate/GenerateApp.tsx`:

```tsx
import { useState } from "react"

import { DropArea } from "@generate/DropArea"
import { GeneratePreview } from "@generate/GeneratePreview"
import { useGenerate } from "@generate/useGenerate"

import { useVariations } from "@state/useVariations"

import { hashInput } from "@utils/hashInput"
import { navigate } from "@utils/navigate"

import styles from "./GenerateApp.module.css"

const PASSWORD_KEY = "generate-password"

function sourcePreviewOf(input: GenerateInput): string {
  return input.type === "text"
    ? input.text.trim().slice(0, 200)
    : `image (${input.mediaType})`
}

export default function GenerateApp() {
  const [input, setInput] = useState<GenerateInput | null>(null)
  const [password, setPassword] = useState(
    () => localStorage.getItem(PASSWORD_KEY) ?? ""
  )
  const [inputError, setInputError] = useState<string | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [name, setName] = useState("")

  const { status, result, error, generate, reset } = useGenerate()
  const { createVariation, findByHash, selectVariation } = useVariations()

  const handleGenerate = async () => {
    if (!input) return
    setInputError(null)
    setExistingId(null)
    localStorage.setItem(PASSWORD_KEY, password)

    const h = await hashInput(input)
    setHash(h)

    const existing = findByHash(h)
    if (existing) {
      setExistingId(existing.id)
      return
    }
    await generate({ password, input })
  }

  const handleRegenerate = async () => {
    if (!input) return
    setExistingId(null)
    await generate({ password, input })
  }

  const handleOpenExisting = () => {
    if (!existingId) return
    selectVariation(existingId)
    navigate("/edit-resume")
  }

  const handleConfirm = () => {
    if (!result || !input) return
    createVariation(name || result.suggestedName, result.data, {
      hash: hash ?? undefined,
      sourcePreview: sourcePreviewOf(input),
      origin: "generated",
    })
    navigate("/edit-resume")
  }

  const handleDiscard = () => {
    reset()
    setExistingId(null)
  }

  if (status === "done" && result) {
    return (
      <main className={styles.page}>
        <h1>Review generated resume</h1>
        <GeneratePreview
          data={result.data}
          name={name || result.suggestedName}
          onNameChange={setName}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
        />
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <h1>Generate a tailored resume</h1>
      <p className={styles.hint}>
        Paste a job posting (text or screenshot). Claude tailors the base resume
        into a new variation — the original is never modified.
      </p>

      <DropArea value={input} onChange={setInput} onError={setInputError} />

      <label className={styles.passwordLabel}>
        Password
        <input
          aria-label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {existingId && (
        <div className={styles.notice} role="status">
          <span>Already generated from this exact input.</span>
          <button type="button" onClick={handleOpenExisting}>
            Open existing
          </button>
          <button type="button" onClick={handleRegenerate}>
            Regenerate
          </button>
        </div>
      )}

      {(inputError || error) && (
        <p className={styles.error} role="alert">
          {inputError ?? error}
        </p>
      )}

      <button
        type="button"
        disabled={!input || !password || status === "generating"}
        onClick={handleGenerate}
      >
        {status === "generating" ? "Generating…" : "Generate"}
      </button>
    </main>
  )
}
```

`src/generate/GenerateApp.module.css`:

```css
.page {
  display: grid;
  gap: 24px;
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 24px;
  color: var(--text);
}

.hint {
  color: var(--muted);
}

.passwordLabel {
  display: grid;
  gap: 6px;
  justify-items: start;
  color: var(--muted);
}

.notice {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
}

.error {
  color: var(--accent2);
}
```

- [ ] **Step 8: Run the full suite**

Run: `bun run test && bun ts:check && bun lint`
Expected: PASS — all existing tests stay green (public page untouched)

- [ ] **Step 9: Commit**

```bash
bun prettier
git add src/generate/
git commit -m "$(cat <<'EOF'
CJR: add `/generate` page with preview, dedupe, and variation save

- `GenerateApp` wires `DropArea`, password, `useGenerate`, `hashInput`
- hash dedupe offers open-existing/regenerate before spending an API call
- `GeneratePreview` loads result into `useStore`, renders view-mode sections
- confirm saves variation with `hash`/`sourcePreview`/`origin` and
  navigates to `/edit-resume`
EOF
)"
```

---

### Task 10: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full system check**

Run: `bun system-check`
Expected: prettier, tsc (both projects), eslint, vitest, and `vite build` all pass.

- [ ] **Step 2: Manual smoke test with `netlify dev`**

```bash
# one-time: create .env from .env.example with real values
bunx netlify-cli dev
```

Then in the browser at the printed URL:

1. Visit `/generate` — page renders without Sky/Weather chrome.
2. Paste job-posting text + password → Generate → preview appears with a suggested name.
3. Save & edit → lands on `/edit-resume` with the variation active; edit + Generate PDF work.
4. Re-paste the same text → "Already generated" dedupe notice appears; Open existing navigates.
5. Paste a screenshot image of a posting → generation works via vision.
6. Wrong password → "Wrong password" error; base `resume.json` and `/` unchanged throughout.

- [ ] **Step 3: Deploy checklist (manual, Netlify UI)**

- Set `ANTHROPIC_API_KEY` and `GENERATE_PASSWORD` in Site settings → Environment variables.
- Deploy the branch; verify `/generate` on the deploy preview.

---

## Self-Review Notes

- **Spec coverage:** route (T6), drop area text+image (T8), function+Claude+structured output (T4–5), hash+dedupe (T2, T9), variation meta (T3), preview+save+editor handoff (T9), password gate (T4–5, T9), config/alias/env (T1), tests throughout, manual E2E (T10). Timeout risk is a deploy-time observation (spec §Known risk) — no code task needed for v1.
- **Type consistency:** `GenerateInput`/`GenerateRequest`/`GenerateResponse`/`VariationMeta` defined once in T2 and consumed by name everywhere; `createVariation(name, data, meta?)` signature identical in T3 and T9; status codes produced in T5 match those handled in T7.
- **Placeholders:** none — every code step has full code. The one intentional "check first" instruction (section props in T9 preview, SDK `output_config` typing in T5) directs the implementer to a specific existing file rather than leaving a gap.
