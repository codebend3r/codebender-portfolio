import { type FormEvent, useEffect, useRef, useState } from "react"

import { createPortal } from "react-dom"

import styles from "@edit/RenameModal.module.css"

export function RenameModal({
  open,
  title,
  initialName,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  initialName: string
  confirmLabel: string
  onConfirm: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const input = inputRef.current
    input?.focus()
    input?.select()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const trimmed = name.trim()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!trimmed) return
    onConfirm(trimmed)
    onClose()
  }

  return createPortal(
    <div className={styles.backdrop}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-modal-title"
        onSubmit={submit}
      >
        <h2 id="rename-modal-title" className={styles.title}>
          {title}
        </h2>
        <input
          ref={inputRef}
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={title}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.confirm} disabled={!trimmed}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
