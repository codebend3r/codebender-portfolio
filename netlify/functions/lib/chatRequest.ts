// Validates the /api/chat request body before it ever reaches the model:
// caps on turn count and message length keep a single request cheap, and the
// strict-alternation check keeps the shape something the model API accepts.
import type Anthropic from "@anthropic-ai/sdk"

const MAX_MESSAGES = 20
const MAX_CONTENT_CHARS = 1_000
const MAX_TOTAL_CHARS = 12_000

type ChatRole = "user" | "assistant"
type ChatMessage = { role: ChatRole; content: string }

function isChatRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant"
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false
  if (!("role" in value) || !isChatRole(value.role)) return false
  if (!("content" in value) || typeof value.content !== "string") return false
  return value.content.length > 0 && value.content.length <= MAX_CONTENT_CHARS
}

// Every entry must differ in role from its predecessor, and the
// conversation must open and close on a user turn.
function alternatesStartingAndEndingWithUser(messages: ChatMessage[]): boolean {
  if (messages.length === 0) return false
  if (messages[0].role !== "user") return false
  if (messages[messages.length - 1].role !== "user") return false
  return messages.every(
    (message, index) => index === 0 || message.role !== messages[index - 1].role
  )
}

export function parseChatRequest(
  body: unknown
): Anthropic.Beta.BetaMessageParam[] | null {
  if (typeof body !== "object" || body === null) return null
  if (!("messages" in body) || !Array.isArray(body.messages)) return null
  if (body.messages.length < 1 || body.messages.length > MAX_MESSAGES)
    return null
  if (!body.messages.every(isChatMessage)) return null
  if (!alternatesStartingAndEndingWithUser(body.messages)) return null

  const totalChars = body.messages.reduce(
    (sum, message) => sum + message.content.length,
    0
  )
  if (totalChars > MAX_TOTAL_CHARS) return null

  return body.messages
}
