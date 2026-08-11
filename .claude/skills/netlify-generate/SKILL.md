---
name: netlify-generate
description: Use when touching anything under `netlify/functions/`, the `/generate` flow (`src/generate/`), or debugging why generation hangs, 404s locally, or dies in production. Covers the local `netlify dev` requirement and the function time budget, which is far shorter than the code comments imply.
---

# Netlify Functions & the `/generate` Flow

## Overview

`/generate` turns a job posting into a tailored resume variation. The path:

```
src/generate/useGenerate.ts   POST /generate  → 202 immediately
netlify/functions/generate.mts        background handler → Claude → blob write
netlify/functions/generate-status.mts GET /generate-status?id= → poll
```

State lives in the `generate-jobs` blob store (`consistency: "strong"`), keyed by job
id. The client polls `generate-status` until the blob reads `done` or `error`.

Two things break this flow, and neither produces a useful error message.

## 1. Local dev needs `netlify dev`, not `bun dev`

`bun dev` starts Vite on **4242**. Vite knows nothing about `netlify/functions/` —
every call to `/generate` and `/generate-status` returns **404**, and the UI simply
appears broken.

Functions only exist under the Netlify Dev proxy:

```bash
bunx netlify-cli dev      # serves on http://localhost:8888
```

**Browse 8888, not 4242.** `netlify.toml` wires this up: `[dev]` runs `command = "bun dev"`
and proxies to `targetPort = 4242`, and Netlify Dev's own port (8888) is the only one
where both the app and the functions answer.

Local runs also need a real `.env` — see `.env.example`:

| Var | Used by | Absent means |
|---|---|---|
| `ANTHROPIC_API_KEY` | `generate.mts` | the Claude call throws; job blob gets `error` |
| `GENERATE_PASSWORD` | `validatePassword` | every request fails the password gate |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client sync | cloud sync features stay hidden (by design) |

## 2. The real time budget is ~30s, not 15 minutes

Netlify **documents** background functions as running up to 15 minutes. **On the Free
plan this site is on, they are silently killed at roughly 30 seconds.** No error, no log
line, no blob write — the job blob just stays `pending` forever and the client polls
until it gives up.

So the effective contract is:

- The handler must reach a terminal blob write (`done` or `error`) **well inside 30s**.
- `POLL_TIMEOUT_MS` in `src/generate/useGenerate.ts` is 240s. That is a *client patience*
  budget, not a promise about the server. A job that is still `pending` at 30s is
  already dead; the remaining polls are waiting on a process that no longer exists.
- A permanently-`pending` blob is the signature of this failure. Read it that way before
  suspecting the model call.

This is why the handler uses `claude-haiku-4-5` — the cheapest, fastest tier — with
`max_tokens: 4000`. **Do not swap in a slower model or raise `max_tokens` without
measuring end-to-end wall time.** The model choice is a latency decision, not a cost one.

`output_config.effort` is unsupported on Haiku 4.5 and errors if passed.

## Write the Error Before You Return

Every exit path must write a terminal blob. A `return` without a write leaves the job
`pending` forever, which the client cannot distinguish from "still working."

The password check deliberately runs **before** the first blob write, so an
unauthenticated caller can neither seed nor overwrite a job blob under an arbitrary id.
Keep any new validation on that same side of the first write.

## Testing

The pure helpers are unit-tested and network-free — put logic there, not in the handler:

- `lib/prompt.ts` — request parsing, `PATCH_SCHEMA`, constant-time `validatePassword`
- `lib/patch.ts` — `isResumePatch` guard + `applyResumePatch`
- `lib/jobPage.ts` — posting fetch and text extraction, `JobPageError`

```bash
bun run test netlify/                          # helper suites
bun typecheck                                  # includes netlify/functions project
bunx netlify-cli dev                           # then exercise /generate at :8888
```

The handler itself has no unit test — it is I/O end to end. Verify it by running it.

## Red Flags

| Thought | Reality |
|---|---|
| "`/generate` 404s, the route is broken" | You're on 4242. Functions only exist on 8888 under `netlify dev`. |
| "The comment says 15 minutes, I have room" | ~30s on this plan. The 15-minute figure is Netlify's docs, not this site's behavior. |
| "The job is still pending, give it another minute" | Past ~30s it is dead. Nothing will ever write that blob. |
| "I'll use a stronger model for better output" | Latency is the binding constraint. Measure wall time before switching. |
| "I'll bump `POLL_TIMEOUT_MS` so it has longer" | The client waiting longer does not make the server live longer. |
| "Early return here is fine" | Not without a terminal blob write. Pending-forever is the worst failure mode. |
| "I'll validate the password after seeding the job" | That lets an unauthenticated caller write blobs at a chosen id. Keep it first. |
| "I'll add `effort` to the model call" | Errors on Haiku 4.5. |

## Checklist

- [ ] Exercised at `http://localhost:8888` via `bunx netlify-cli dev`
- [ ] `.env` has `ANTHROPIC_API_KEY` and `GENERATE_PASSWORD`
- [ ] Every return path writes a terminal blob (`done` or `error`)
- [ ] Password validation still precedes the first blob write
- [ ] End-to-end wall time measured and comfortably under 30s
- [ ] New logic landed in `lib/` with a sibling test, not in the handler
- [ ] `bun run test` and `bun typecheck` pass
