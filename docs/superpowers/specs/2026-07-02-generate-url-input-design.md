# `/generate` URL input, background function + progress/error UX — Design

**Date:** 2026-07-02
**Status:** Approved
**Extends:** [2026-07-02-generate-route-design.md](./2026-07-02-generate-route-design.md)

## Goal

Four gaps observed in real use of `/generate`:

1. **The sync function times out — generation never succeeds in production.**
   Netlify synchronous functions are killed at 10s (26s max on request), and
   even streamed responses are capped at 10s. The Claude call generates the
   full tailored resume (~5k+ output tokens) and takes 1–3 minutes — the
   deploy-preview request dies at ~26–30s with a runtime-level
   `{errorType: "Error", errorMessage: "An unknown error has occurred"}`.
   This is the "Known risk — function timeout" from the parent spec, realized;
   the documented fallback (background function + polling) is now built.
2. Pasting a **job-posting URL** silently degrades: the URL is sent to Claude
   as literal text, so the model tailors against a bare link it cannot fetch.
3. While generating, the only feedback is the disabled button label — no
   visible **in-progress indicator**.
4. Server error details are discarded in favor of a generic message, and a
   hung request can spin forever.

## Requirements

1. Generation completes reliably in production regardless of how long the
   Claude call takes (within Netlify's 15-minute background budget).
2. Pasting a URL (alone) into the drop area generates from the **fetched job
   posting**, not the literal URL string.
3. A visible progress indicator (spinner + status text) while generating.
4. Failures always surface in the UI: server-side errors (wrong password,
   unfetchable URL, generation failure) are shown verbatim, and the client
   polling loop has a hard cap so it can never spin forever.

## Design — background function + polling

- `netlify/functions/generate.mts` becomes a **background function**
  (`config.background = true`; same `/.netlify/functions/generate` URL).
  Netlify returns **202 immediately**; the handler runs up to 15 minutes.
  Background functions are available on credit-based (including Free) plans.
- The client generates a **job id** (`crypto.randomUUID()`) and sends it in
  the POST body. The function writes job state to **Netlify Blobs**
  (store `generate-jobs`, key = job id, strong consistency):
  `{ status: "pending" }` → `{ status: "done", data, suggestedName }` or
  `{ status: "error", error }`. Because a background function cannot return a
  body, **all** failures (including wrong password) are reported through the
  blob.
- New sync function `netlify/functions/generate-status.mts`:
  `GET ?id=<jobId>` → the job blob, or `{ status: "pending" }` when the blob
  does not exist yet (covers cold-start lag).
- `useGenerate` becomes POST → poll every ~2.5s → `done`/`error`, with a
  **4-minute client-side cap** that surfaces a timeout error. Job blobs are
  small and left in place (unguessable random keys; no auto-expiry needed).

## Design

## Design — URL input type

`GenerateInput` gains a third member:

```ts
type GenerateInput =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; dataBase64: string }
  | { type: "url"; url: string }
```

- **Detection (client):** `src/utils/normalizeInput.ts` exports
  `normalizeInput(input)`. A text input whose trimmed content is a single
  `http(s)://` URL (no whitespace, nothing else) becomes `{ type: "url" }`.
  Applied in `GenerateApp.handleGenerate` before hashing/POSTing, so the
  textarea keeps behaving as plain text while typing.
- **Hash/dedupe:** `hashInput` adds a `url:${url}` branch — same URL, same
  hash. `sourcePreview` is the URL itself.
- **Fetch (server):** the browser cannot fetch job boards cross-origin, so the
  Netlify function does it. New `netlify/functions/lib/jobPage.ts`:
  - `extractPostingText(html)` — pure, unit-testable: drops
    `script`/`style`/`noscript`/comments/`head`, turns block-level tags into
    newlines, strips remaining tags, decodes common entities, collapses
    whitespace, caps at the existing 50k-char text limit.
  - `fetchPostingText(url)` — fetches with a browser-like `User-Agent`, a
    15s `AbortSignal.timeout` (generous — we're in the background budget),
    requires an HTML/text content-type, and throws `JobPageError` with a
    human-readable message when the page can't be fetched or yields under
    ~200 chars of text (e.g. JS-rendered postings).
  - `generate.mts` resolves a `url` input to a `text` input via
    `fetchPostingText` before the existing Claude call; `JobPageError`
    messages land in the job blob as `{ status: "error", error }`. Claude
    never receives a bare URL.
- **Validation:** `parseGenerateRequest` accepts `{ type: "url", url }` only
  for parseable `http(s)` URLs ≤ 2048 chars, and now also requires a `jobId`
  (8–64 chars of `[0-9a-fA-F-]`).

## Design — progress indicator

While `status === "generating"`, `GenerateApp` renders a `role="status"` row:
a CSS spinner (module-scoped keyframe) plus "Generating your tailored resume —
this can take a minute or two." The button stays disabled with its current
label.

## Design — error surfacing

- `useGenerate` surfaces the job blob's `error` string verbatim (wrong
  password, unfetchable URL, generation failure) plus local failures: a
  non-202 on the kickoff POST, a network error, or the 4-minute polling cap.
- The existing `role="alert"` error line renders all of these.

## Out of scope

- Headless-browser rendering of JS-only postings (the error message tells the
  user to paste the text instead).
- URL canonicalization beyond trimming (tracking params stay part of the
  hash).
- Streaming partial generation output to the client.
- Job-blob expiry/cleanup (keys are unguessable UUIDs; entries are ~20KB).

## Testing

- `normalizeInput` — lone URL → `url` input; surrounding whitespace ok; URLs
  embedded in longer text stay `text`; non-http schemes stay `text`.
- `hashInput` — `url` determinism; differs from a `text` input of the same
  string.
- `prompt.test.ts` — accepts valid `url` requests with `jobId`; rejects
  `javascript:`/oversized/malformed URLs and missing/invalid `jobId`.
- `jobPage.test.ts` — `extractPostingText` strips scripts/tags/entities,
  preserves visible text, enforces the cap.
- `useGenerate.test.ts` — POST + poll to `done` maps to result; blob `error`
  surfaces verbatim; non-202 kickoff and poll-cap timeout surface errors.
- `GenerateApp.test.tsx` — pasted URL POSTs `{ type: "url" }`; progress
  indicator visible mid-flight; server error message rendered.
- `generate.mts`/`generate-status.mts` stay thin I/O wrappers around the
  tested lib functions (no direct unit tests; blob/SDK calls mocked at the
  boundary would test mocks, not behavior).
