import { useCallback, useRef, useState } from "react"

import { readNdjson } from "./readNdjson"

// The Netlify streaming function's route (see the design spec's
// "Wire protocol" section) — not the Netlify function path directly, so a
// future redirect/rewrite change in netlify.toml doesn't touch this file.
const CHAT_ENDPOINT = "/api/chat"

export type ChatRole = "user" | "assistant"

export type ChatUserMessage = {
  id: string
  role: "user"
  text: string
  // "failed" only for a fetch that never reached the server (offline, DNS,
  // CORS, etc.); a non-2xx response still means the message was sent.
  status: "sent" | "failed"
}

export type ChatAssistantMessage = {
  id: string
  role: "assistant"
  text: string
  status:
    | "waiting" // request in flight, no delta text yet
    | "streaming" // at least one delta received
    | "done"
    | "stopped" // aborted via stop(), partial text kept
    | "truncated" // ended on a "max_tokens" stop, partial text kept
    | "error" // a stream `error` event arrived, partial text kept
  // Set only when status is "error"; the wire protocol's `error.message`.
  errorMessage?: string
}

export type ChatMessage = ChatUserMessage | ChatAssistantMessage

export type ChatStatus = "idle" | "streaming" | "error"

// The four top-level alert categories from the bot design spec's copy deck.
// The UI switches on this, never on `errorMessage`'s prose, so a copy edit
// here can never silently break which alert renders.
export type ChatErrorKind = "limit" | "resting" | "offline" | "generic"

export type UseChatResult = {
  status: ChatStatus
  messages: ChatMessage[]
  // Set when `status` is "error": a top-level failure before any answer
  // streamed (non-2xx response, or the fetch itself rejected). Only
  // classifies *which* alert to show — `Composer.tsx`'s `ALERT_COPY` is the
  // single source of truth for the actual user-facing text per kind. A
  // stream `error` event, by contrast, is recorded on the assistant message
  // itself (see `ChatAssistantMessage.errorMessage`) and does not set this.
  errorKind: ChatErrorKind | null
  send: (args: { text: string }) => Promise<void>
  // Aborts the in-flight request, if any; the streaming assistant message is
  // marked "stopped" with whatever text arrived so far.
  stop: () => void
  // Re-sends the most recent user message as a fresh turn, replacing
  // whatever came after it (a failed send, or an errored/stopped answer).
  retry: () => Promise<void>
  // Clears the whole conversation and aborts any running stream.
  reset: () => void
}

function mintId(): string {
  return crypto.randomUUID()
}

// Maps a non-2xx status to its `ChatErrorKind`, per the design spec's
// wire-protocol table (400/429/503); anything else falls back to the 400
// kind, since it is not a status `parseChatRequest`/the usage gate would
// ever produce.
function errorKindForStatus(status: number): ChatErrorKind {
  if (status === 429) return "limit"
  if (status === 503) return "resting"
  return "generic"
}

// Shown on the assistant message itself when a stream ends without a
// terminal `done`/`error` event.
const STREAM_ENDED_MESSAGE = "That answer didn't come through."

function toWireMessages(
  messages: ChatMessage[]
): { role: ChatRole; content: string }[] {
  return messages
    .filter((message) =>
      message.role === "user" ? message.status !== "failed" : true
    )
    .filter((message) => message.text.length > 0)
    .map((message) => ({ role: message.role, content: message.text }))
}

export function useChat(): UseChatResult {
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [errorKind, setErrorKind] = useState<ChatErrorKind | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const updateAssistant = useCallback(
    (
      id: string,
      updater: (message: ChatAssistantMessage) => ChatAssistantMessage
    ) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id && message.role === "assistant"
            ? updater(message)
            : message
        )
      )
    },
    []
  )

  const markUserFailed = useCallback((id: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id && message.role === "user"
          ? { ...message, status: "failed" }
          : message
      )
    )
  }, [])

  const dropMessage = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id))
  }, [])

  const runTurn = useCallback(
    async ({ text, history }: { text: string; history: ChatMessage[] }) => {
      const trimmed = text.trim()
      if (trimmed.length === 0) return

      const userId = mintId()
      const assistantId = mintId()
      const userMessage: ChatUserMessage = {
        id: userId,
        role: "user",
        text: trimmed,
        status: "sent",
      }
      const assistantMessage: ChatAssistantMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
        status: "waiting",
      }

      setMessages([...history, userMessage, assistantMessage])
      setStatus("streaming")
      setErrorKind(null)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: toWireMessages([...history, userMessage]),
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          dropMessage(assistantId)
          setStatus("error")
          setErrorKind(errorKindForStatus(response.status))
          return
        }

        if (!response.body) {
          dropMessage(assistantId)
          setStatus("error")
          setErrorKind("generic")
          return
        }

        const iterator = readNdjson(response.body)[Symbol.asyncIterator]()
        let next = await iterator.next()
        let terminated = false

        while (!next.done) {
          if (controller.signal.aborted) {
            updateAssistant(assistantId, (message) => ({
              ...message,
              status: "stopped",
            }))
            terminated = true
            break
          }

          const event = next.value
          if (event.type === "delta") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              text: message.text + event.text,
              status: "streaming",
            }))
          } else if (event.type === "done") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              status: event.stop === "max_tokens" ? "truncated" : "done",
            }))
            terminated = true
            break
          } else {
            updateAssistant(assistantId, (message) => ({
              ...message,
              status: "error",
              errorMessage: event.message,
            }))
            terminated = true
            break
          }

          next = await iterator.next()
        }

        if (!terminated) {
          updateAssistant(assistantId, (message) =>
            message.status === "waiting" || message.status === "streaming"
              ? {
                  ...message,
                  status: "error",
                  errorMessage: STREAM_ENDED_MESSAGE,
                }
              : message
          )
        }

        setStatus("idle")
      } catch {
        if (controller.signal.aborted) {
          updateAssistant(assistantId, (message) => ({
            ...message,
            status: "stopped",
          }))
          setStatus("idle")
          return
        }

        markUserFailed(userId)
        dropMessage(assistantId)
        setStatus("error")
        setErrorKind("offline")
      } finally {
        abortRef.current = null
      }
    },
    [dropMessage, markUserFailed, updateAssistant]
  )

  const send = useCallback(
    ({ text }: { text: string }) => {
      if (status === "streaming") return Promise.resolve()
      return runTurn({ text, history: messages })
    },
    [status, messages, runTurn]
  )

  const retry = useCallback(() => {
    if (status === "streaming") return Promise.resolve()
    const lastUserIndex = messages.reduce<number>(
      (foundIndex, message, index) =>
        message.role === "user" ? index : foundIndex,
      -1
    )
    if (lastUserIndex === -1) return Promise.resolve()
    const lastUser = messages[lastUserIndex]
    return runTurn({
      text: lastUser.text,
      history: messages.slice(0, lastUserIndex),
    })
  }, [status, messages, runTurn])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setStatus("idle")
    setErrorKind(null)
  }, [])

  return {
    status,
    messages,
    errorKind,
    send,
    stop,
    retry,
    reset,
  }
}
