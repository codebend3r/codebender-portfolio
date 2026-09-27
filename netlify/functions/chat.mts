import Anthropic from "@anthropic-ai/sdk"
import { getStore } from "@netlify/blobs"
import type { Config, Context } from "@netlify/functions"

import type { ChatEvent } from "../../src/chat/readNdjson"
import { recruiterNotes } from "../../src/data/recruiterNotes"
import { baseResume } from "./lib/baseResume"
import { buildChatSystem } from "./lib/chatPrompt"
import { parseChatRequest } from "./lib/chatRequest"
import { toChatStopReason } from "./lib/chatStopReason"
import { checkAndCountUsage } from "./lib/chatUsage"
import { visitorKey } from "./lib/visitorKey"

// Streaming synchronous function (not background): Netlify's streaming
// functions get a 60s execution limit, ample for a short chat answer. Routed
// at /api/chat via `path` below (the design spec calls for `config.path`
// explicitly, unlike /generate's default `/.netlify/functions/generate`
// route). Rate limit enforced at the edge before the function runs.
export const config: Config = {
  path: "/api/chat",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
}

const CHAT_MODEL: Anthropic.Model = "claude-opus-5"
const MAX_TOKENS = 2_000

function json(status: number, body: { error: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== "POST") return json(405, { error: "method not allowed" })

  const body: unknown = await req.json().catch(() => null)
  const messages = parseChatRequest(body)
  if (!messages) return json(400, { error: "invalid request" })

  const key = visitorKey({
    ip: context.ip,
    salt: process.env.CHAT_HASH_SALT ?? "",
  })
  const usageStore = getStore({ name: "chat-usage", consistency: "strong" })
  const usage = await checkAndCountUsage({
    store: usageStore,
    visitorKey: key,
    day: todayUtc(),
  })
  if (!usage.allowed && usage.reason === "visitor") {
    return json(429, { error: "daily question limit reached" })
  }
  if (!usage.allowed && usage.reason === "global") {
    return json(503, { error: "assistant is resting for today" })
  }

  // Kill switch: unset ANTHROPIC_API_KEY to take the endpoint down without a
  // redeploy of the launcher flag.
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, { error: "assistant is unavailable" })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const system = buildChatSystem({
    resume: baseResume,
    notes: recruiterNotes,
    now: new Date(),
  })

  const modelStream = client.beta.messages.stream({
    model: CHAT_MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages,
  })

  const encoder = new TextEncoder()
  const encodeEvent = (event: ChatEvent): Uint8Array =>
    encoder.encode(`${JSON.stringify(event)}\n`)

  const responseBody = new ReadableStream<Uint8Array>({
    start(controller) {
      modelStream.on("text", (delta) => {
        controller.enqueue(encodeEvent({ type: "delta", text: delta }))
      })

      // A `max_tokens` stop still streams whatever text was produced before
      // this fires; the client appends "(answer truncated)" itself. A
      // "refusal" stop_reason (all server-side fallbacks declined) is
      // reported as an `error` event instead of `done`, per the wire
      // protocol's "failure after streaming started" behavior.
      modelStream.on("finalMessage", (message) => {
        const stop = toChatStopReason(message.stop_reason)
        const event: ChatEvent =
          stop === "refusal"
            ? {
                type: "error",
                message:
                  "the assistant declined to answer that — try rephrasing",
              }
            : { type: "done", stop }
        controller.enqueue(encodeEvent(event))
        controller.close()
      })

      modelStream.on("error", (err) => {
        console.error(
          "chat stream failed:",
          err instanceof Error ? err.message : err
        )
        controller.enqueue(
          encodeEvent({
            type: "error",
            message: "that answer didn't come through — try again",
          })
        )
        controller.close()
      })
    },
    cancel() {
      // The client aborted (Stop button, navigation, or the request was
      // otherwise dropped) — stop paying for tokens no one will read.
      modelStream.abort()
    },
  })

  return new Response(responseBody, {
    status: 200,
    headers: { "content-type": "application/x-ndjson" },
  })
}
