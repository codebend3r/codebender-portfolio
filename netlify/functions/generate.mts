import Anthropic from "@anthropic-ai/sdk"
import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"

import resume from "../../src/data/resume.json"
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

const baseResume: Data = resume

// Background function: Netlify replies 202 immediately and lets the handler
// run up to 15 minutes. The Claude call can take tens of seconds — past the
// 10s/26s synchronous limit that killed generation in production. Job state
// goes to the `generate-jobs` blob store, polled via /generate-status.
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

  await write({ status: "pending" })

  if (!validatePassword(parsed.password, process.env.GENERATE_PASSWORD ?? "")) {
    await write({ status: "error", error: "wrong password" })
    return
  }

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
      system: buildSystemPrompt(baseResume),
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
