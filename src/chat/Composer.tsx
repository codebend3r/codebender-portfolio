import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useId,
  useState,
} from "react"

import { resumeData } from "@data/resumeData"

import { AlertIcon, SendIcon } from "./icons"
import type { ChatErrorKind, UseChatResult } from "./useChat"

import styles from "./ChatPanel.module.css"

const CONVERSATION_LIMIT = 20
const TOO_LONG_LIMIT = 1000
const COUNTER_THRESHOLD = 800
const COPY_CONFIRMATION_MS = 2000

const EMAIL =
  resumeData.contact.find((entry) => entry.label === "Email")?.value ??
  "cj.rivas.dev@gmail.com"

const ALERT_COPY: Record<
  ChatErrorKind,
  { bold: string; muted: string; actions: "email" | "retry" | "none" }
> = {
  limit: {
    bold: "You've reached today's limit of 30 questions.",
    muted: "CJ can answer anything else directly.",
    actions: "email",
  },
  resting: {
    bold: "The assistant is off for today.",
    muted: "CJ can answer anything directly.",
    actions: "email",
  },
  offline: {
    bold: "You're offline.",
    muted: "Your question is still in the box; send it again when you're back.",
    actions: "none",
  },
  generic: {
    bold: "That answer didn't come through.",
    muted: "",
    actions: "retry",
  },
}

function AlertBanner({
  kind,
  onRetry,
  onCopyEmail,
}: {
  kind: ChatErrorKind
  onRetry: () => void
  onCopyEmail: () => void
}) {
  const copy = ALERT_COPY[kind]
  return (
    <div role="alert" className={styles.alert}>
      <div className={styles.alertHead}>
        <AlertIcon className={styles.alertIcon} />
        <p className={styles.alertBold}>{copy.bold}</p>
      </div>
      {!!copy.muted && <p className={styles.alertMuted}>{copy.muted}</p>}
      {copy.actions === "email" && (
        <div className={styles.alertActions}>
          <a className={styles.alertAction} href={`mailto:${EMAIL}`}>
            Email CJ
          </a>
          <button
            type="button"
            className={styles.alertAction}
            onClick={onCopyEmail}
          >
            Copy email
          </button>
        </div>
      )}
      {copy.actions === "retry" && (
        <div className={styles.alertActions}>
          <button
            type="button"
            className={styles.alertAction}
            onClick={onRetry}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

export type ComposerProps = {
  chat: UseChatResult
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

export function Composer({ chat, textareaRef }: ComposerProps) {
  const [text, setText] = useState("")
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const textareaId = useId()
  const counterId = useId()

  const handleCopyEmail = () => {
    if (!navigator.clipboard) return
    navigator.clipboard
      .writeText(EMAIL)
      .then(() => {
        setCopyStatus("Email copied")
        window.setTimeout(() => setCopyStatus(null), COPY_CONFIRMATION_MS)
      })
      .catch(() => {
        // Clipboard permission denied or unavailable; no fallback UI.
      })
  }

  const isConversationFull = chat.messages.length >= CONVERSATION_LIMIT
  const errorKind = chat.errorKind
  const composerLocked = errorKind === "limit" || errorKind === "resting"
  const trimmedLength = text.trim().length
  const overLimit = text.length > TOO_LONG_LIMIT

  const sendDisabled =
    chat.status !== "streaming" &&
    (trimmedLength === 0 || overLimit || isConversationFull || composerLocked)

  const submitText = () => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > TOO_LONG_LIMIT) return
    if (chat.status === "streaming" || isConversationFull || composerLocked)
      return
    void chat.send({ text: trimmed })
    setText("")
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (chat.status === "streaming") {
      chat.stop()
      return
    }
    submitText()
  }

  const handleTextareaKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (chat.status === "streaming") return
      submitText()
    }
  }

  return (
    <div className={styles.composerArea}>
      <div role="status" className={styles.srOnly}>
        {copyStatus ?? ""}
      </div>
      {errorKind && (
        <AlertBanner
          kind={errorKind}
          onRetry={() => void chat.retry()}
          onCopyEmail={handleCopyEmail}
        />
      )}
      {isConversationFull && (
        <div role="alert" className={styles.alert}>
          <p className={styles.alertBold}>This conversation is at its limit.</p>
          <div className={styles.alertActions}>
            <button
              type="button"
              className={styles.alertAction}
              onClick={() => chat.reset()}
            >
              Start a new conversation
            </button>
          </div>
        </div>
      )}
      <form className={styles.composer} onSubmit={handleSubmit}>
        <label htmlFor={textareaId} className={styles.srOnly}>
          Your question
        </label>
        <div className={styles.field}>
          <textarea
            id={textareaId}
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Ask about CJ's work, stack, or history"
            value={text}
            rows={2}
            disabled={composerLocked || isConversationFull}
            aria-describedby={
              text.length > COUNTER_THRESHOLD ? counterId : undefined
            }
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
          />
          <button
            type="submit"
            className={styles.send}
            aria-label={chat.status === "streaming" ? "Stop" : "Send"}
            disabled={sendDisabled}
          >
            {chat.status === "streaming" ? "Stop" : <SendIcon />}
          </button>
        </div>
        <div className={styles.meta}>
          <p className={styles.privacy}>
            Answers come from Claude, an AI model, and can be wrong. Don&rsquo;t
            share personal information.
          </p>
          {text.length > COUNTER_THRESHOLD && (
            <span id={counterId} className={styles.counter}>
              {text.length.toLocaleString()} / 1,000
            </span>
          )}
        </div>
        {overLimit && (
          <p role="alert" className={styles.tooLong}>
            Questions can be up to 1,000 characters.
          </p>
        )}
      </form>
    </div>
  )
}
