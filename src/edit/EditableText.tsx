import { useLayoutEffect, useRef } from "react"

import { useEditing } from "@edit/EditContext"
import styles from "@edit/EditableText.module.css"

import { useStore } from "@state/useStore"

export function EditableText({
  value,
  path,
  multiline = false,
  ariaLabel,
}: {
  value: string
  path: PathKey[]
  multiline?: boolean
  ariaLabel?: string
}) {
  const { editing, markDirty } = useEditing()
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (multiline && ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  })

  if (!editing) return <>{value}</>

  const commit = (next: string) => {
    useStore.getState().setPath(path, next)
    markDirty()
  }

  if (multiline) {
    return (
      <textarea
        ref={ref}
        className={styles.field}
        value={value}
        aria-label={ariaLabel}
        rows={1}
        onChange={(e) => commit(e.target.value)}
      />
    )
  }

  return (
    <input
      className={styles.field}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => commit(e.target.value)}
    />
  )
}
