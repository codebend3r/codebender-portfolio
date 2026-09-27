// Pure async generator over the /api/chat NDJSON response body. One JSON
// event per line; a line's text can arrive split across multiple stream
// chunks, so we buffer until a newline completes it. Malformed or unknown
// lines are skipped, never thrown.

// Mirrors @anthropic-ai/sdk's `StopReason`, kept as our own alias so the
// client bundle never needs to import the SDK just for this literal union.
export type ChatStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "tool_use"
  | "pause_turn"
  | "refusal"
  | "model_context_window_exceeded"

export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "done"; stop: ChatStopReason }
  | { type: "error"; message: string }

const STOP_REASONS: ReadonlySet<string> = new Set([
  "end_turn",
  "max_tokens",
  "stop_sequence",
  "tool_use",
  "pause_turn",
  "refusal",
  "model_context_window_exceeded",
])

function isChatStopReason(value: unknown): value is ChatStopReason {
  return typeof value === "string" && STOP_REASONS.has(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isChatEvent(value: unknown): value is ChatEvent {
  if (!isRecord(value)) return false
  if (value.type === "delta") return typeof value.text === "string"
  if (value.type === "done") return isChatStopReason(value.stop)
  if (value.type === "error") return typeof value.message === "string"
  return false
}

function parseLine(line: string): ChatEvent | null {
  const trimmed = line.trim()
  if (trimmed.length === 0) return null
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return isChatEvent(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Yields each valid event in order. Uses a manual `while` loop (not
// `for`/`for...of`) purely because `yield` cannot appear inside an
// `Array.prototype` callback — the array building above still goes through
// `map`/`filter`.
export async function* readNdjson(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ChatEvent, void, void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    let reading = true
    while (reading) {
      const { done, value } = await reader.read()
      if (done) {
        reading = false
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      const events = lines
        .map(parseLine)
        .filter((event): event is ChatEvent => event !== null)

      let index = 0
      while (index < events.length) {
        yield events[index]
        index += 1
      }
    }

    buffer += decoder.decode()
    const trailing = parseLine(buffer)
    if (trailing) yield trailing
  } finally {
    reader.releaseLock()
  }
}
