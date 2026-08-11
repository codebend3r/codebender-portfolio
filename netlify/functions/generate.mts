import Anthropic from "@anthropic-ai/sdk"
import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"

import { baseResume } from "./lib/baseResume"
import { JobPageError, fetchPostingText } from "./lib/jobPage"
import { applyResumePatch, isResumePatch } from "./lib/patch"
import type { PromptInput } from "./lib/prompt"
import {
  PATCH_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  isImageMediaType,
  parseGenerateRequest,
  validatePassword,
} from "./lib/prompt"

// Background function: Netlify replies 202 immediately and the handler runs
// detached, past the 10s/26s synchronous limit that killed generation in
// production. Job state goes to the `generate-jobs` blob store, polled via
// /generate-status.
//
// BUDGET: Netlify documents background functions at up to 15 minutes, but on
// the Free plan this site runs on they are silently killed at roughly 30s —
// no error, no log, no blob write. Every path here must reach a terminal blob
// write well inside 30s, which is why the model below is the fastest tier.
// A job blob stuck on `pending` is this timeout, not a model failure.
// See the `netlify-generate` skill.
export const config: Config = { background: true }

// Resolves the wire input into what the model call accepts: url inputs
// become fetched text, image media types are narrowed to the Claude set.
async function resolveInput(input: GenerateInput): Promise<PromptInput | null> {
  if (input.type === "text") return input
  if (input.type === "url") {
    return {
      type: "text",
      text: `Job posting fetched from ${input.url}:\n\n${await fetchPostingText(input.url)}`,
    }
  }
  if (!isImageMediaType(input.mediaType)) return null
  return {
    type: "image",
    mediaType: input.mediaType,
    dataBase64: input.dataBase64,
  }
}

export default async (req: Request): Promise<void> => {
  if (req.method !== "POST") return

  const body: unknown = await req.json().catch(() => null)
  const parsed = parseGenerateRequest(body)
  if (!parsed) return // no valid jobId to report through

  const jobs = getStore({ name: "generate-jobs", consistency: "strong" })
  const write = (job: GenerateJob) => jobs.setJSON(parsed.jobId, job)

  // Check the password before the first blob write so an unauthenticated
  // caller can neither seed nor overwrite a job blob under an arbitrary id.
  if (!validatePassword(parsed.password, process.env.GENERATE_PASSWORD ?? "")) {
    await write({ status: "error", error: "wrong password" })
    return
  }

  await write({ status: "pending" })

  try {
    const input = await resolveInput(parsed.input)
    if (!input) {
      await write({ status: "error", error: "unsupported image format" })
      return
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      // Haiku 4.5: cheapest/fastest tier, supports json_schema output.
      // No `effort` here — output_config.effort errors on Haiku 4.5.
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      output_config: {
        format: { type: "json_schema", schema: PATCH_SCHEMA },
      },
      system: buildSystemPrompt({ base: baseResume, mode: parsed.mode }),
      messages: [{ role: "user", content: buildUserContent(input) }],
    })

    const text = response.content.find((b) => b.type === "text")?.text ?? ""
    if (!text) {
      await write({ status: "error", error: "empty model response" })
      return
    }

    const patch: unknown = JSON.parse(text)
    if (!isResumePatch(patch)) {
      await write({ status: "error", error: "malformed model response" })
      return
    }

    await write({
      status: "done",
      data: applyResumePatch(baseResume, patch),
      suggestedName: patch.suggestedName,
    })
  } catch (err) {
    console.error("generate failed:", err instanceof Error ? err.message : err)
    await write({
      status: "error",
      error:
        err instanceof JobPageError
          ? err.message
          : "generation failed — try again",
    })
  }
}
