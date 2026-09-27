import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import { resumeData } from "@data/resumeData"

import { experienceId } from "@utils/experienceId"
import { parsePeriod } from "@utils/period"

import type { AnswerBlock } from "./parseAnswer"
import { parseAnswer } from "./parseAnswer"
import { CHAT_STARTERS } from "./starters"
import { TimelineFigure } from "./TimelineFigure"
import type {
  ChatAssistantMessage,
  ChatErrorKind,
  ChatMessage,
  ChatStatus,
} from "./useChat"
import { useChat } from "./useChat"

import styles from "./ChatPanel.module.css"

// The recruiter chat's `<dialog>` panel: docked and non-modal at 48rem and
// wider, full-screen modal below it (see the bot design spec's "Layout").

const NARROW_QUERY = "(min-width: 48rem)"
const REM_PX = 16
const JUMP_THRESHOLD_PX = 4 * REM_PX
const SOURCE_HIGHLIGHT_MS = 2000
const COPY_CONFIRMATION_MS = 2000
const CONVERSATION_LIMIT = 20
const TOO_LONG_LIMIT = 1000
const COUNTER_THRESHOLD = 800

const KNOWN_IDS: ReadonlySet<string> = new Set(
  resumeData.work_experience.map((entry) =>
    experienceId({ company: entry.company, period: entry.period })
  )
)

const ID_TO_ENTRY = new Map(
  resumeData.work_experience.map((entry) => [
    experienceId({ company: entry.company, period: entry.period }),
    entry,
  ])
)

const EMAIL =
  resumeData.contact.find((entry) => entry.label === "Email")?.value ??
  "cj.rivas.dev@gmail.com"

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function chipInfo(
  id: string
): { label: string; company: string; year: number } | null {
  const entry = ID_TO_ENTRY.get(id)
  if (!entry) return null
  const bounds = parsePeriod({ period: entry.period })
  if (!bounds) return null
  const year = Math.floor(bounds.start / 12)
  return { label: `${entry.company} ${year}`, company: entry.company, year }
}

type TextGroup = { bulleted: boolean; lines: string[] }

// The client never renders markdown (see the bot design spec's "Length and
// format"): the only structure recognized is blank-line paragraphs and `- `
// bulleted lines.
function textGroups(text: string): TextGroup[] {
  return text
    .split(/\n{2,}/)
    .map((group) => group.trim())
    .filter((group) => group.length > 0)
    .map((group) => {
      const lines = group
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
      const bulleted =
        lines.length > 0 && lines.every((line) => /^-\s+/.test(line))
      return {
        bulleted,
        lines: bulleted
          ? lines.map((line) => line.replace(/^-\s+/, ""))
          : lines,
      }
    })
}

function TextBlock({ text }: { text: string }) {
  const groups = textGroups(text)
  return (
    <>
      {groups.map((group, index) =>
        group.bulleted ? (
          <ul key={index}>
            {group.lines.map((line, lineIndex) => (
              <li key={lineIndex}>{line}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>{group.lines.join(" ")}</p>
        )
      )}
    </>
  )
}

function SourceChips({
  sourceIds,
  onActivateRole,
}: {
  sourceIds: readonly string[]
  onActivateRole: (id: string) => void
}) {
  const chips = sourceIds.reduce<
    { id: string; info: NonNullable<ReturnType<typeof chipInfo>> }[]
  >((acc, id) => {
    const info = chipInfo(id)
    return info ? [...acc, { id, info }] : acc
  }, [])
  if (chips.length === 0) return null

  return (
    <div className={styles.sources}>
      <span className={styles.sourcesLabel}>From the resume</span>
      <div className={styles.chips}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={styles.chip}
            aria-label={`Go to ${chip.info.company}, ${chip.info.year} on the page`}
            onClick={() => onActivateRole(chip.id)}
          >
            {chip.info.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function AnswerContent({
  message,
  onActivateRole,
}: {
  message: ChatAssistantMessage
  onActivateRole: (id: string) => void
}) {
  const streaming =
    message.status === "waiting" || message.status === "streaming"
  const { blocks, sourceIds } = useMemo(
    () => parseAnswer({ text: message.text, knownIds: KNOWN_IDS, streaming }),
    [message.text, streaming]
  )

  const renderBlock = (block: AnswerBlock, index: number) =>
    block.type === "timeline" ? (
      <TimelineFigure
        key={`timeline-${index}`}
        ids={block.ids}
        onActivateRole={onActivateRole}
      />
    ) : (
      <TextBlock key={`text-${index}`} text={block.text} />
    )

  return (
    <>
      {blocks.map(renderBlock)}
      <SourceChips sourceIds={sourceIds} onActivateRole={onActivateRole} />
    </>
  )
}

function WaitingIndicator() {
  return (
    <span className={styles.waiting}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.waitingText}>Thinking</span>
    </span>
  )
}

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

function AlertIcon() {
  return (
    <svg
      className={styles.alertIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  )
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
        <AlertIcon />
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

function RobotAvatar({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <path d="M9 17h6" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  )
}

function NewConversationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 5 14 14" />
      <path d="m19 5-14 14" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

function isDialogModal(dialog: HTMLDialogElement): boolean {
  try {
    return dialog.matches(":modal")
  } catch {
    return false
  }
}

function isAssistantBusy(message: ChatMessage): boolean {
  return (
    message.role === "assistant" &&
    (message.status === "waiting" || message.status === "streaming")
  )
}

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
  const { stop } = chat
  const dialogRef = useRef<HTMLDialogElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const statusRef = useRef<ChatStatus>(chat.status)
  statusRef.current = chat.status

  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return !window.matchMedia(NARROW_QUERY).matches
  })
  const [text, setText] = useState("")
  const [showJump, setShowJump] = useState(false)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  const titleId = useId()
  const textareaId = useId()
  const counterId = useId()

  // Track the 48rem breakpoint so we know which of show()/showModal() to
  // use, and reopen in the correct mode if the viewport crosses it while
  // the panel is already open.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mql = window.matchMedia(NARROW_QUERY)
    const update = () => setIsNarrow(!mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!open) {
      if (dialog.open) dialog.close()
      return
    }

    if (!dialog.open) {
      if (isNarrow) {
        dialog.showModal()
      } else {
        dialog.show()
      }
      return
    }

    if (isDialogModal(dialog) !== isNarrow) {
      dialog.close()
      if (isNarrow) {
        dialog.showModal()
      } else {
        dialog.show()
      }
    }
  }, [open, isNarrow])

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus()
    } else {
      returnFocusRef.current?.focus()
    }
  }, [open, returnFocusRef])

  // `Escape` stops an active stream, or otherwise closes the panel — for
  // both the non-modal (`show()`, no native Escape handling at all) and the
  // modal (`showModal()`, native `cancel` event) cases.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleEscape = () => {
      if (statusRef.current === "streaming") {
        stop()
        return
      }
      onCloseRef.current()
    }

    const onCancel = (event: Event) => {
      event.preventDefault()
      handleEscape()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (isDialogModal(dialog)) return
      handleEscape()
    }

    dialog.addEventListener("cancel", onCancel)
    dialog.addEventListener("keydown", onKeyDown)
    return () => {
      dialog.removeEventListener("cancel", onCancel)
      dialog.removeEventListener("keydown", onKeyDown)
    }
  }, [stop])

  const scrollToBottom = () => {
    const log = logRef.current
    if (!log) return
    log.scrollTo({
      top: log.scrollHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  // Follows a stream only while the reader is already near the bottom;
  // otherwise shows "Jump to latest" instead of yanking the view down.
  useEffect(() => {
    const log = logRef.current
    if (!log) return
    const stillStreaming = chat.messages.some(isAssistantBusy)
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
  }, [chat.messages])

  const handleLogScroll = () => {
    const log = logRef.current
    if (!log || chat.status !== "streaming") return
    const distanceFromBottom =
      log.scrollHeight - log.scrollTop - log.clientHeight
    setShowJump(distanceFromBottom > JUMP_THRESHOLD_PX)
  }

  const handleActivateRole = (id: string) => {
    if (isNarrow) onCloseRef.current()
    const heading = document.getElementById(`exp-${id}`)
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

      <div className={styles.logArea}>
        <div
          ref={logRef}
          className={styles.log}
          role="log"
          onScroll={handleLogScroll}
        >
          {chat.messages.length === 0 && (
            <div className={styles.starters}>
              <p className={styles.introLead}>
                Ask about CJ&rsquo;s experience, stack, or work history.
              </p>
              <p className={styles.introDetail}>
                I answer from CJ&rsquo;s resume and notes CJ wrote for
                recruiters. For anything else, I&rsquo;ll point you to CJ.
              </p>
              {CHAT_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className={styles.starter}
                  onClick={() => handleStarterClick(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {chat.messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className={styles.userRow}>
                <span className={styles.userLabel}>You</span>
                <p className={styles.bubble}>{message.text}</p>
                {message.status === "failed" && (
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => void chat.retry()}
                  >
                    Not sent. Retry
                  </button>
                )}
              </div>
            ) : (
              <div
                key={message.id}
                className={styles.assistantRow}
                aria-busy={isAssistantBusy(message)}
              >
                <RobotAvatar className={styles.assistantAvatar} />
                <span className={styles.assistantLabel}>Assistant</span>
                <div className={styles.assistantBody}>
                  {message.status === "waiting" ? (
                    <WaitingIndicator />
                  ) : (
                    <>
                      <AnswerContent
                        message={message}
                        onActivateRole={handleActivateRole}
                      />
                      {message.status === "streaming" && (
                        <span className={styles.caret} aria-hidden="true" />
                      )}
                      {message.status === "stopped" && (
                        <span className={styles.suffix}> (stopped)</span>
                      )}
                      {message.status === "truncated" && (
                        <span className={styles.suffix}>
                          {" "}
                          (answer truncated)
                        </span>
                      )}
                      {message.status === "error" && !!message.errorMessage && (
                        <div role="alert" className={styles.inlineAlert}>
                          <p>{message.errorMessage}</p>
                          <button
                            type="button"
                            className={styles.retryButton}
                            onClick={() => void chat.retry()}
                          >
                            Try again
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>
        {showJump && (
          <button
            type="button"
            className={styles.jump}
            onClick={() => {
              scrollToBottom()
              setShowJump(false)
            }}
          >
            Jump to latest
          </button>
        )}
      </div>

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
            <p className={styles.alertBold}>
              This conversation is at its limit.
            </p>
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
              Answers come from Claude, an AI model, and can be wrong.
              Don&rsquo;t share personal information.
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
    </dialog>
  )
}
