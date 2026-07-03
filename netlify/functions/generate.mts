import Anthropic from "@anthropic-ai/sdk"
import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"

import resume from "../../src/data/resume.json"
import { JobPageError, fetchPostingText } from "./lib/jobPage"
import {
  WRAPPER_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  parseGenerateRequest,
  validatePassword,
} from "./lib/prompt"

// Background function: Netlify replies 202 immediately and lets the handler
// run up to 15 minutes. The Claude call takes 1-3 minutes — far past the
// 10s/26s synchronous limit that killed generation in production. Job state
// goes to the `generate-jobs` blob store, polled via /generate-status.
export const config: Config = { background: true }

export default async (req: Request): Promise<void> => {
  if (req.method !== "POST") return

  const body = await req.json().catch(() => null)
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
    const input =
      parsed.input.type === "url"
        ? {
            type: "text" as const,
            text: `Job posting fetched from ${parsed.input.url}:\n\n${await fetchPostingText(parsed.input.url)}`,
          }
        : parsed.input

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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
          content: buildUserContent(input) as Anthropic.ContentBlockParam[],
        },
      ],
    })

    const text = response.content.find((b) => b.type === "text")?.text
    if (!text) {
      await write({ status: "error", error: "empty model response" })
      return
    }

    const { resume: data, suggestedName } = JSON.parse(text) as {
      resume: Data
      suggestedName: string
    }
    await write({ status: "done", data, suggestedName })
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
