import { type RefObject, useCallback, useEffect, useState } from "react"

import { prefersReducedMotion } from "@utils/prefersReducedMotion"

import type { ChatMessage, ChatStatus } from "./useChat"

const REM_PX = 16
const JUMP_THRESHOLD_PX = 4 * REM_PX

export function isAssistantBusy(message: ChatMessage): boolean {
  return (
    message.role === "assistant" &&
    (message.status === "waiting" || message.status === "streaming")
  )
}

// Follows a stream only while the reader is already near the bottom of the
// log; otherwise exposes `showJump` so the panel can offer "Jump to latest"
// instead of yanking the view down while they're rereading something above.
export function useAutoScroll({
  logRef,
  messages,
  status,
}: {
  logRef: RefObject<HTMLDivElement | null>
  messages: ChatMessage[]
  status: ChatStatus
}): {
  showJump: boolean
  jumpToBottom: () => void
  handleLogScroll: () => void
} {
  const [showJump, setShowJump] = useState(false)

  const scrollToBottom = useCallback(() => {
    const log = logRef.current
    if (!log) return
    log.scrollTo({
      top: log.scrollHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }, [logRef])

  useEffect(() => {
    const log = logRef.current
    if (!log) return
    const stillStreaming = messages.some(isAssistantBusy)
    if (!stillStreaming) {
      setShowJump(false)
      return
    }
    const distanceFromBottom =
      log.scrollHeight - log.scrollTop - log.clientHeight
    if (distanceFromBottom <= JUMP_THRESHOLD_PX) {
      scrollToBottom()
    } else {
      setShowJump(true)
    }
  }, [messages, logRef, scrollToBottom])

  const handleLogScroll = () => {
    const log = logRef.current
    if (!log || status !== "streaming") return
    const distanceFromBottom =
      log.scrollHeight - log.scrollTop - log.clientHeight
    setShowJump(distanceFromBottom > JUMP_THRESHOLD_PX)
  }

  const jumpToBottom = () => {
    scrollToBottom()
    setShowJump(false)
  }

  return { showJump, jumpToBottom, handleLogScroll }
}
