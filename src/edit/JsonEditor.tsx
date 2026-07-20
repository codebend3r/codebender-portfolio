import { useState } from "react"

import styles from "@edit/JsonEditor.module.css"

import { useStore } from "@state/useStore"

import { validateData } from "@utils/isData"
import { toData } from "@utils/toData"

function serializeStore(): string {
  return JSON.stringify(toData(useStore.getState()), null, 2)
}

type ParseResult = { ok: true; value: unknown } | { ok: false; error: string }

function parseJson(text: string): ParseResult {
  try {
    const value: unknown = JSON.parse(text)
    return { ok: true, value }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" }
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "saved" }

export function JsonEditor({
  initialData,
  onSave,
  markDirty,
  persists,
}: {
  initialData: Data
  onSave: () => void
  markDirty: () => void
  persists: boolean
}) {
  // Seeded from the normalized selection passed in; remounts (keyed on the
  // variation) re-seed, so switching resumes shows the right JSON.
  const [text, setText] = useState(() => JSON.stringify(initialData, null, 2))
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  const onChange = (value: string) => {
    setText(value)
    setStatus({ kind: "idle" })
    markDirty()
  }

  const onApply = () => {
    const parsed = parseJson(text)
    if (!parsed.ok) {
      setStatus({ kind: "error", message: `Invalid JSON: ${parsed.error}` })
      return
    }

    const result = validateData(parsed.value)
    if (!result.ok) {
      setStatus({ kind: "error", message: result.error })
      return
    }

    // `loadData` normalizes and backfills, so re-seed from the store to show
    // the canonical form the app will actually use.
    useStore.getState().loadData(result.data)
    setText(serializeStore())
    setStatus({ kind: "saved" })
    onSave()
  }

  return (
    <section className={styles.editor} aria-label="Resume JSON editor">
      <div className={styles.bar}>
        <span className={styles.hint}>
          {persists
            ? "Edit the raw resume JSON, then Save to validate and apply."
            : "The base resume is read-only — Save previews changes but does not persist them. Create a variation to keep edits."}
        </span>
        <button type="button" className={styles.save} onClick={onApply}>
          Save JSON
        </button>
      </div>

      {status.kind === "error" && (
        <p className={styles.error} role="alert">
          {status.message}
        </p>
      )}
      {status.kind === "saved" && (
        <p className={styles.ok} role="status">
          Saved — JSON is valid.
        </p>
      )}

      <textarea
        className={styles.textarea}
        aria-label="Resume JSON"
        spellCheck={false}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  )
}
