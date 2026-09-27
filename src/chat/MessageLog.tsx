import { useMemo, useRef } from "react"

import { resumeData } from "@data/resumeData"

import { experienceId } from "@utils/experienceId"
import { parsePeriod } from "@utils/period"

import { RobotAvatar } from "./icons"
import type { AnswerBlock } from "./parseAnswer"
import { parseAnswer } from "./parseAnswer"
import { CHAT_STARTERS } from "./starters"
import { TimelineFigure } from "./TimelineFigure"
import { isAssistantBusy, useAutoScroll } from "./useAutoScroll"
import type { ChatAssistantMessage, ChatMessage, ChatStatus } from "./useChat"

import styles from "./ChatPanel.module.css"

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

export type MessageLogProps = {
  messages: ChatMessage[]
  status: ChatStatus
  onStarterClick: (starter: string) => void
  onRetry: () => void
  onActivateRole: (id: string) => void
}

export function MessageLog({
  messages,
  status,
  onStarterClick,
  onRetry,
  onActivateRole,
}: MessageLogProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const { showJump, jumpToBottom, handleLogScroll } = useAutoScroll({
    logRef,
    messages,
    status,
  })

  return (
    <div className={styles.logArea}>
      <div
        ref={logRef}
        className={styles.log}
        role="log"
        onScroll={handleLogScroll}
      >
        {messages.length === 0 && (
          <div className={styles.starters}>
            <p className={styles.introLead}>
              Ask about CJ&rsquo;s experience, stack, or work history.
            </p>
            <p className={styles.introDetail}>
              I answer from CJ&rsquo;s resume and notes CJ wrote for recruiters.
              For anything else, I&rsquo;ll point you to CJ.
            </p>
            {CHAT_STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                className={styles.starter}
                onClick={() => onStarterClick(starter)}
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className={styles.userRow}>
              <span className={styles.userLabel}>You</span>
              <p className={styles.bubble}>{message.text}</p>
              {message.status === "failed" && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={onRetry}
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
                      onActivateRole={onActivateRole}
                    />
                    {message.status === "streaming" && (
                      <span className={styles.caret} aria-hidden="true" />
                    )}
                    {message.status === "stopped" && (
                      <span className={styles.suffix}> (stopped)</span>
                    )}
                    {message.status === "truncated" && (
                      <span className={styles.suffix}> (answer truncated)</span>
                    )}
                    {message.status === "error" && !!message.errorMessage && (
                      <div role="alert" className={styles.inlineAlert}>
                        <p>{message.errorMessage}</p>
                        <button
                          type="button"
                          className={styles.retryButton}
                          onClick={onRetry}
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
        <button type="button" className={styles.jump} onClick={jumpToBottom}>
          Jump to latest
        </button>
      )}
    </div>
  )
}
