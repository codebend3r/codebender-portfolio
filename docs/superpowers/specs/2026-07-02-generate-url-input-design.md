# `/generate` URL input + progress/error UX — Design

**Date:** 2026-07-02
**Status:** Approved
**Extends:** [2026-07-02-generate-route-design.md](./2026-07-02-generate-route-design.md)

## Goal

Three gaps observed in real use of `/generate`:

1. Pasting a **job-posting URL** silently degrades: the URL is sent to Claude
   as literal text, so the model tailors against a bare link it cannot fetch.
2. While generating, the only feedback is the disabled button label — no
   visible **in-progress indicator**.
3. When the function hangs or fails, the client `fetch` has no timeout, so the
   UI can spin forever, and server error details are discarded in favor of a
   generic message.

## Requirements

1. Pasting a URL (alone) into the drop area generates from the **fetched job
   posting**, not the literal URL string.
2. A visible progress indicator (spinner + status text) while generating.
3. Failures always surface in the UI: server-provided error messages are
   shown, and a client-side timeout converts a hung request into an error.

## Design

### URL input type

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
  - `fetchPostingText(url)` — fetches with a browser-like `User-Agent`, an
    8s `AbortSignal.timeout` (inside the Netlify sync budget), requires an
    HTML/text content-type, and throws `JobPageError` with a human-readable
    message when the page can't be fetched or yields under ~200 chars of text
    (e.g. JS-rendered postings).
  - `generate.mts` resolves a `url` input to a `text` input via
    `fetchPostingText` before the existing Claude call; `JobPageError` maps to
    **422** `{ error: <message> }`. Claude never receives a bare URL.
- **Validation:** `parseGenerateRequest` accepts `{ type: "url", url }` only
  for parseable `http(s)` URLs ≤ 2048 chars.

### Progress indicator

While `status === "generating"`, `GenerateApp` renders a `role="status"` row:
a CSS spinner (module-scoped keyframe) plus "Generating your tailored resume —
usually takes 10–20 seconds." The button stays disabled with its current
label.

### Error surfacing

- `useGenerate` reads the response body's `error` field and surfaces it
  verbatim for non-OK responses (401 keeps the friendlier "Wrong password");
  fallback to the existing generic message when the body has none.
- The client `fetch` gets a 30s `AbortSignal.timeout` (Netlify's hard cap is
  26s) so a hung function surfaces "Timed out — the function took too long"
  instead of spinning forever. The existing `role="alert"` error line renders
  all of these.

## Out of scope

- Headless-browser rendering of JS-only postings (the 422 message tells the
  user to paste the text instead).
- URL canonicalization beyond trimming (tracking params stay part of the
  hash).
- Streaming/background generation (unchanged from the parent spec).

## Testing

- `normalizeInput` — lone URL → `url` input; surrounding whitespace ok; URLs
  embedded in longer text stay `text`; non-http schemes stay `text`.
- `hashInput` — `url` determinism; differs from a `text` input of the same
  string.
- `prompt.test.ts` — accepts valid `url` requests; rejects `javascript:`/
  oversized/malformed URLs.
- `jobPage.test.ts` — `extractPostingText` strips scripts/tags/entities,
  preserves visible text, enforces the cap.
- `useGenerate.test.ts` — server `error` body surfaces; abort/timeout maps to
  a timeout message.
- `GenerateApp.test.tsx` — pasted URL POSTs `{ type: "url" }`; progress
  indicator visible mid-flight; server error message rendered.
