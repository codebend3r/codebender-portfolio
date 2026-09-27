// Parses `[[exp:<id>]]` and `[[timeline:<id>,...]]` markers out of a model
// answer (see docs/superpowers/specs/2026-09-26-recruiter-chat-bot-design.md,
// "Rich answers: citations and the timeline"). Pure and stateless: the caller
// re-parses the full accumulated answer text on every streamed delta, so this
// never needs to remember anything between calls.
//
// Design decision: only `[[exp:<id>]]` markers feed the deduplicated
// "From the resume" source-chip list. `[[timeline:...]]` ids are NOT added
// as sources — the worked example in the bot design doc re-tags the same
// roles with `[[exp:...]]` right after the timeline line specifically to get
// them into the chips, which only makes sense if the timeline itself doesn't
// already contribute to that list.

export type AnswerBlock =
  | { type: "text"; text: string }
  | { type: "timeline"; ids: string[] }

export type ParsedAnswer = {
  blocks: AnswerBlock[]
  sourceIds: string[]
}

// While streaming, an unclosed "[[" is held back from the render until "]]"
// arrives or this many characters (counted from the "[[") have passed,
// whichever comes first.
const HOLD_BACK_LIMIT = 64

const EXP_MARKER_PATTERN = /\[\[exp:([^[\]]+)]]/g
const TIMELINE_LINE_PATTERN = /^\[\[timeline:([^[\]]+)]]$/

function dedupe(ids: string[]): string[] {
  return ids.reduce<string[]>(
    (deduped, id) => (deduped.includes(id) ? deduped : [...deduped, id]),
    []
  )
}

// Strips a trailing, still-unclosed "[[...]]" attempt from the text so it
// never renders half-formed. Fully closed markers earlier in the text are
// left untouched.
function withoutHeldBackTail({
  text,
  streaming,
}: {
  text: string
  streaming: boolean
}): string {
  const openIndex = text.lastIndexOf("[[")
  if (openIndex === -1) return text

  const isClosed = text.indexOf("]]", openIndex) !== -1
  if (isClosed) return text

  const tailLength = text.length - openIndex
  const shouldHoldBack = streaming && tailLength < HOLD_BACK_LIMIT
  return shouldHoldBack ? text.slice(0, openIndex) : text
}

type LineRecord =
  | { kind: "timeline"; ids: string[] }
  | { kind: "text"; text: string; expIds: string[] }

function parseTimelineLine({
  line,
  knownIds,
}: {
  line: string
  knownIds: ReadonlySet<string>
}): LineRecord | null {
  const match = line.trim().match(TIMELINE_LINE_PATTERN)
  if (!match) return null

  const ids = dedupe(
    match[1]
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && knownIds.has(id))
  )
  return { kind: "timeline", ids }
}

function parseTextLine({
  line,
  knownIds,
}: {
  line: string
  knownIds: ReadonlySet<string>
}): LineRecord {
  const expIds: string[] = []
  const text = line
    .replace(EXP_MARKER_PATTERN, (_match, id: string) => {
      if (knownIds.has(id)) expIds.push(id)
      return ""
    })
    .trim()
  return { kind: "text", text, expIds }
}

function parseLine({
  line,
  knownIds,
}: {
  line: string
  knownIds: ReadonlySet<string>
}): LineRecord {
  return (
    parseTimelineLine({ line, knownIds }) ?? parseTextLine({ line, knownIds })
  )
}

type BlockAcc = { blocks: AnswerBlock[]; buffer: string[] }

function flushBuffer(acc: BlockAcc): AnswerBlock[] {
  if (acc.buffer.length === 0) return acc.blocks
  return [...acc.blocks, { type: "text", text: acc.buffer.join("\n") }]
}

function toBlocks(records: LineRecord[]): AnswerBlock[] {
  const grouped = records.reduce<BlockAcc>(
    (acc, record) => {
      if (record.kind === "text") {
        return { blocks: acc.blocks, buffer: [...acc.buffer, record.text] }
      }
      // A timeline left with fewer than 2 known ids is dropped entirely:
      // no block, and the line contributes nothing else to the output.
      if (record.ids.length < 2) return acc
      return {
        blocks: [...flushBuffer(acc), { type: "timeline", ids: record.ids }],
        buffer: [],
      }
    },
    { blocks: [], buffer: [] }
  )

  return flushBuffer(grouped)
}

function toSourceIds(records: LineRecord[]): string[] {
  return dedupe(
    records.flatMap((record) => (record.kind === "text" ? record.expIds : []))
  )
}

export function parseAnswer({
  text,
  knownIds,
  streaming,
}: {
  text: string
  knownIds: ReadonlySet<string>
  streaming: boolean
}): ParsedAnswer {
  const safeText = withoutHeldBackTail({ text, streaming })
  const records = safeText
    .split("\n")
    .map((line) => parseLine({ line, knownIds }))

  return { blocks: toBlocks(records), sourceIds: toSourceIds(records) }
}
