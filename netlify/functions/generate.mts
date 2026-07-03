import Anthropic from "@anthropic-ai/sdk"

import resume from "../../src/data/resume.json"
import {
  WRAPPER_SCHEMA,
  buildSystemPrompt,
  buildUserContent,
  parseGenerateRequest,
  validatePassword,
} from "./lib/prompt"

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

  // Narrows the type; parseGenerateRequest does not emit url inputs yet.
  if (parsed.input.type === "url") {
    return json(501, { error: "url input not supported yet" })
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
