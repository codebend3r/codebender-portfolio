# AI resume generation + `/generate` route — Design

**Date:** 2026-07-02
**Status:** Approved

## Goal

Let the user paste a job posting — as **text or an image** — and have Claude
generate a tailored **variation** of the resume, saved under a stable content
**hash** with a human-memorable **name**. The generated resume is a first-class
[variation](./2026-06-30-resume-variations-edit-route-design.md): it flows into
the existing `useVariations` store and is editable / exportable via the existing
`/edit-resume` editor.

`src/data/resume.json` stays the **immutable base / source of truth** and is
never read-modified-written. Claude is given the base as ground truth and asked
to reorder, re-emphasize, and rewrite for a target role **without inventing
facts**. The public `/` route is untouched.

The Claude API key is held **server-side** in a Netlify serverless function; it
never reaches the browser bundle.

## Requirements

1. A hidden route `/generate` renders a generation UI (no Sky/Weather/nav
   chrome), consistent with how `/edit-resume` is mounted.
2. The user can paste/drop **text** or an **image** (e.g. a job-posting
   screenshot) into a drop area.
3. On submit, the app sends the input to a Netlify function that calls Claude and
   returns a valid `Data` object plus a suggested variation name.
4. The app computes a **stable content hash** of the input. The same input always
   produces the same hash; the hash is used to **dedupe** (offer to open an
   existing variation instead of regenerating).
5. The generated resume is saved as a **variation** via `useVariations`, carrying
   its `hash`, a short `sourcePreview` (memory aid for "what the input was"), and
   `origin: "generated"`.
6. After saving, the user lands in `/edit-resume` with the new variation active
   (inline editing + PDF export come for free).
7. The base `resume.json`, the public `/` page, and any existing variations are
   never mutated by generation.
8. Generation is gated by an **owner password** so visitors to the public
   portfolio cannot spend API credits.

## Architecture

A generated resume **is a variation** — this is the crux. All immutability and
editing/PDF requirements are already satisfied by the variations system; this
feature only adds (a) an input surface, (b) a server-side Claude call, and (c) a
content hash on the variation.

Three layers:

- **`/generate` page (client)** — collects text/image + password, computes the
  hash, calls the function, previews the result, and on confirm creates the
  variation and routes to `/edit-resume`.
- **Netlify function (server)** — holds `ANTHROPIC_API_KEY`, validates the owner
  password, calls Claude with the base resume as ground truth + the pasted job
  posting, returns `{ data, suggestedName }` using structured output.
- **`useVariations` (existing, extended)** — persists the generated variation
  with its hash/source metadata; the `/edit-resume` editor reads it unchanged.

Routing stays a `pathname` branch in `Entry.tsx`; no router library is added.

### Module map

| Module                             | Responsibility                                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Entry.tsx`                    | Extend `routeFor` to `"generate" \| "edit" \| "app"`. `/generate` → mount `GenerateApp`; `applySky()` skipped as on `/edit-resume`.                                                                 |
| `src/generate/GenerateApp.tsx`     | Page root. Drop area + password field + Generate button; on success shows `GeneratePreview`; on confirm creates the variation, `selectVariation(id)`, and `window.location.assign("/edit-resume")`. |
| `src/generate/DropArea.tsx`        | Accepts pasted text and pasted/dropped images. Emits a normalized `GenerateInput` (text or `{mediaType, dataBase64}`). Enforces the client-side image size cap.                                     |
| `src/generate/GeneratePreview.tsx` | Read-only preview of the returned `Data` (reuses existing section components in view mode) + editable name field pre-filled with `suggestedName`.                                                   |
| `src/generate/useGenerate.ts`      | Hook: POST to `/.netlify/functions/generate`, manages `idle \| hashing \| generating \| done \| error`, surfaces server errors (401 wrong password, 5xx, timeout).                                  |
| `src/generate/*.module.css`        | Colocated CSS Modules; spacing via grid + gap, no margins (project convention).                                                                                                                     |
| `src/utils/hashInput.ts`           | Pure-ish helper: SHA-256 via Web Crypto over normalized input → 12-char hex id.                                                                                                                     |
| `src/state/useVariations.ts`       | Extend `createVariation` to accept optional `meta` (`hash`/`sourcePreview`/`origin`); add a `findByHash(hash)` selector.                                                                            |
| `src/types/global.d.ts`            | Extend `Variation` with optional `hash`, `sourcePreview`, `origin`.                                                                                                                                 |
| `netlify/functions/generate.mts`   | Server handler: validate password, build messages, call Claude, return `{ data, suggestedName }`.                                                                                                   |
| `netlify/functions/prompt.ts`      | Pure helpers: system prompt builder, `DATA_SCHEMA` (JSON Schema mirroring `Data`), `validatePassword` (constant-time). Unit-testable without network.                                               |
| `netlify/functions/tsconfig.json`  | Node/serverless TS config (no DOM lib) so `bun ts:check` covers functions without polluting the app config.                                                                                         |
| `netlify.toml`                     | Functions directory + esbuild bundler; timeout raised where the plan allows.                                                                                                                        |
| `.env.example`                     | Documents `ANTHROPIC_API_KEY` and `GENERATE_PASSWORD` for `netlify dev`.                                                                                                                            |

### Types

`Variation` gains optional fields (old persisted entries simply lack them — no
migration needed):

```ts
type Variation = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  data: Data
  hash?: string // stable content id of the generating input
  sourcePreview?: string // memory aid: first ~200 chars of text, or "image: <name>"
  origin?: "manual" | "generated"
}
```

New request/response contract for the function:

```ts
type GenerateInput =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; dataBase64: string }

type GenerateRequest = { password: string; input: GenerateInput }
type GenerateResponse = { data: Data; suggestedName: string }
```

## Data flow

1. `Entry.tsx` branches on `window.location.pathname`; `/generate` mounts
   `GenerateApp`.
2. The user pastes text or an image and enters the owner password (remembered in
   `localStorage` for convenience, not for security).
3. On Generate, the client computes `hash = hashInput(input)`. If
   `findByHash(hash)` already exists, it offers **Open existing** /
   **Regenerate** (saves an API call and satisfies "the hash stays constant").
4. Otherwise the client POSTs `{ password, input }` to
   `/.netlify/functions/generate`.
5. The function validates the password (constant-time compare vs
   `GENERATE_PASSWORD`; `401` on mismatch), then calls Claude with:
   - a **system prompt** embedding the canonical `src/data/resume.json` as CJ's
     real experience — "reorder/re-emphasize and rewrite summary + skills for the
     target role; never invent employers, dates, or facts";
   - the pasted job posting as the user turn (text block, or base64 image block
     for vision);
   - `output_config.format` = a JSON Schema wrapper `{ resume: <Data>,
suggestedName: string }` so the reply is guaranteed-valid `Data`.
6. The function returns `{ data, suggestedName }`.
7. `GeneratePreview` shows the result read-only with an editable name field
   (default `suggestedName`).
8. On confirm, `createVariation(name, data, { hash, sourcePreview, origin:
"generated" })` → `selectVariation(id)` → `window.location.assign(
"/edit-resume")`. The editor loads it; inline edit + PDF export are already
   wired.

## Claude call (server)

- **SDK:** `@anthropic-ai/sdk`, run only inside the function (key from
  `process.env.ANTHROPIC_API_KEY`).
- **Model / config:** `claude-opus-4-8`, `output_config: { effort: "medium" }`,
  thinking off, `max_tokens ≈ 8000`, non-streaming. This is a deliberate
  latency choice: resume tailoring is a grounded rewrite, not deep reasoning, and
  Netlify synchronous functions have a ~10s (26s max) budget. Adaptive thinking /
  higher effort is a one-line change if output quality needs it later.
- **Structured output:** wrapper schema `{ resume: DATA_SCHEMA, suggestedName }`;
  the function unwraps `resume` into `Data`. `DATA_SCHEMA` mirrors
  `global.d.ts` (every object `additionalProperties: false` + `required`, arrays
  typed), maintained alongside the type with a cross-reference comment — the same
  "two places kept in sync" pattern the aliases already use.
- **Vision:** an image job-posting is sent as a base64 image content block; no
  OCR.

## Security / cost

- **Owner password gate** in the function blocks credit-burning by visitors.
  Compared in constant time; the `/generate` link is kept out of the public nav
  (route exists, unadvertised).
- **Input caps:** client rejects images above ~3.5 MB pre-encode (Netlify's
  ~6 MB request-body limit vs. base64's ~33% inflation) and oversized text; an
  optional client-side downscale is a later refinement.
- The key and full input are never logged.

## Routing / config

- `/generate` via a `pathname` check in `Entry.tsx`. `bun dev` already serves
  `index.html` for unknown paths; `public/_redirects` already has
  `/*  /index.html  200`, so **no redirects change** is needed.
- New `@generate/*` alias added to **all four** sync points per the alias
  convention: `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`,
  `.prettierrc.mjs`.
- New deps: `@anthropic-ai/sdk` (function runtime) and `@netlify/functions`
  (function types).
- `netlify.toml` declares the functions directory and esbuild bundler.
- `netlify/functions/tsconfig.json` gives the function a Node/serverless config
  so `bun ts:check` (whole-project `tsc --noEmit`) stays green without the app's
  DOM config leaking Node globals or vice-versa.

## Decisions (resolved)

- **Server-side key via Netlify Function**, not React Server Components. RSC would
  require converting this static Vite SPA into an SSR-framework app, and the
  secret-hiding for a user-triggered action is done by a server action / route
  handler anyway — architecturally identical to a Netlify Function, at a fraction
  of the migration cost.
- **A generated resume is a variation**, reusing `useVariations` + the
  `/edit-resume` editor + `@pdf` export, rather than a parallel store or a new
  viewer route.
- **Hash the input, not the output.** Deterministic on the source, enabling
  dedupe and matching the "hash stays constant, name is the memory aid" model.
- **Structured output over prompt-and-parse**, so the reply always fits `Data`.
- **Fast model config over adaptive thinking**, to stay within the Netlify sync
  timeout; tunable upward later.
- **Owner password over open access**, because the live endpoint spends real
  credits.

## Known risk — function timeout

An Opus-4-8 call can occasionally exceed Netlify's 10s sync limit. Mitigations,
in order: the fast model config above; raise the timeout in `netlify.toml` (26s
on Pro); if still tight, move to a **background function + client polling**
(documented, not built in v1).

## Testing

Vitest + Testing Library, colocated as usual:

- `src/utils/hashInput.test.ts` — determinism (same input → same hash), different
  inputs differ, text-normalization stability.
- `src/state/useVariations.test.ts` (extended) — `createVariation` with `meta`
  persists `hash`/`sourcePreview`/`origin`; `findByHash` returns the match /
  `undefined`; existing create/rename/delete/select/save tests stay green.
- `src/generate/useGenerate.test.ts` — mocked `fetch`: success maps to
  `{ data, suggestedName }`; 401 surfaces a wrong-password error; network/5xx
  surfaces an error state.
- `src/generate/DropArea.test.tsx` — paste text emits a text input; paste image
  emits an image input; oversized image is rejected.
- `src/generate/GenerateApp.test.tsx` — hash-dedupe path offers open-existing;
  confirm creates a variation and navigates.
- `netlify/functions/prompt.test.ts` — `validatePassword` (constant-time,
  reject/accept); `DATA_SCHEMA` shape sanity; system-prompt includes the base
  resume.
- `src/Entry.test.ts` (or equivalent) — `routeFor("/generate") === "generate"`.

**Critical invariant:** the public `/` page, `resume.json`, and existing
variations are untouched; all existing tests stay green.

## Out of scope (YAGNI for v1)

- Multi-user auth and per-IP rate limiting (owner password only).
- Editing the base resume from `/generate`.
- Streaming the generation, or a background-function/polling flow (fallback only
  if the sync timeout proves insufficient).
- A separate public `/v/:hash` viewer (the editor already views + exports).
- Client-side image downscaling (hard size cap only in v1).
