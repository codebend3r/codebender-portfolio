// Narrows the Anthropic SDK's stop reason to the wire's ChatStopReason
// (src/chat/readNdjson.ts, type-only import — never bundled at runtime).
// BetaStopReason additionally includes "compaction", which this endpoint
// never produces since it never sends a `compaction` request param, and can
// be `null`. Anything outside the client's known set falls back to
// "end_turn" so the NDJSON `done` event always matches readNdjson.ts's guard.
import type { ChatStopReason } from "../../../src/chat/readNdjson"

const CHAT_STOP_REASONS: ReadonlySet<string> = new Set([
  "end_turn",
  "max_tokens",
  "stop_sequence",
  "tool_use",
  "pause_turn",
  "refusal",
  "model_context_window_exceeded",
])

export function isChatStopReason(value: unknown): value is ChatStopReason {
  return typeof value === "string" && CHAT_STOP_REASONS.has(value)
}

export function toChatStopReason(value: string | null): ChatStopReason {
  return isChatStopReason(value) ? value : "end_turn"
}
