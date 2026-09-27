import { type RefObject, useId, useRef } from "react"

import { prefersReducedMotion } from "@utils/prefersReducedMotion"

import { Composer } from "./Composer"
import { CloseIcon, NewConversationIcon, RobotAvatar } from "./icons"
import { MessageLog } from "./MessageLog"
import { useChat } from "./useChat"
import { useDialogMode } from "./useDialogMode"

import styles from "./ChatPanel.module.css"

// The recruiter chat's `<dialog>` panel: docked and non-modal at 48rem and
// wider, full-screen modal below it (see the bot design spec's "Layout").
// The dialog mode/lifecycle (useDialogMode), the message log and its
// scroll-follow behavior (MessageLog/useAutoScroll), and the composer/alerts
// (Composer) are each their own module — this file only composes them.

const SOURCE_HIGHLIGHT_MS = 2000

export type ChatPanelProps = {
  // Set on the rendered `<dialog>` so the launcher's `aria-controls` can
  // point at it.
  id: string
  open: boolean
  onClose: () => void
  returnFocusRef: RefObject<HTMLElement | null>
}

export default function ChatPanel({
  id,
  open,
  onClose,
  returnFocusRef,
}: ChatPanelProps) {
  const chat = useChat()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()

  const { isNarrow } = useDialogMode({
    dialogRef,
    open,
    onClose,
    returnFocusRef,
    textareaRef,
    status: chat.status,
    stop: chat.stop,
  })

  const handleActivateRole = (roleId: string) => {
    if (isNarrow) onClose()
    const heading = document.getElementById(`exp-${roleId}`)
    if (!heading) return
    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    })
    heading.focus()
    heading.classList.add(styles.sourceHighlight)
    window.setTimeout(() => {
      heading.classList.remove(styles.sourceHighlight)
    }, SOURCE_HIGHLIGHT_MS)
  }

  const handleStarterClick = (starter: string) => {
    void chat.send({ text: starter })
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={styles.dialog}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <RobotAvatar className={styles.headerAvatar} />
        <div className={styles.headerText}>
          <h2 id={titleId} className={styles.title}>
            Ask about CJ
          </h2>
          <p className={styles.subtitle}>
            AI assistant, answers from CJ&rsquo;s resume
          </p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Start a new conversation"
          disabled={chat.messages.length === 0}
          onClick={() => chat.reset()}
        >
          <NewConversationIcon />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Close"
          onClick={() => onClose()}
        >
          <CloseIcon />
        </button>
      </header>

      <MessageLog
        messages={chat.messages}
        status={chat.status}
        onStarterClick={handleStarterClick}
        onRetry={() => void chat.retry()}
        onActivateRole={handleActivateRole}
      />

      <Composer chat={chat} textareaRef={textareaRef} />
    </dialog>
  )
}
