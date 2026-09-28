import { type RefObject, useEffect, useRef, useState } from "react"

import type { ChatStatus } from "./useChat"

const NARROW_QUERY = "(min-width: 48rem)"

function isDialogModal(dialog: HTMLDialogElement): boolean {
  try {
    return dialog.matches(":modal")
  } catch {
    return false
  }
}

// Orchestrates the chat `<dialog>`'s open/close lifecycle: which of
// show()/showModal() to use based on the 48rem breakpoint (switching live if
// the viewport crosses it while the panel is already open), focus management
// on open/close, and `Escape` handling — stopping an active stream first, or
// otherwise closing — for both the modal (native `cancel` event) and
// non-modal (no native Escape handling at all) cases.
export function useDialogMode({
  dialogRef,
  open,
  onClose,
  returnFocusRef,
  textareaRef,
  status,
  stop,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  open: boolean
  onClose: () => void
  returnFocusRef: RefObject<HTMLElement | null>
  textareaRef: RefObject<HTMLTextAreaElement | null>
  status: ChatStatus
  stop: () => void
}): { isNarrow: boolean } {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const statusRef = useRef(status)
  statusRef.current = status

  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return !window.matchMedia(NARROW_QUERY).matches
  })

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

    const openInMode = () => (isNarrow ? dialog.showModal() : dialog.show())

    if (!open) {
      if (dialog.open) dialog.close()
      return
    }

    if (!dialog.open) {
      openInMode()
      return
    }

    if (isDialogModal(dialog) !== isNarrow) {
      dialog.close()
      openInMode()
    }
  }, [dialogRef, open, isNarrow])

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus()
    } else {
      returnFocusRef.current?.focus()
    }
  }, [open, returnFocusRef, textareaRef])

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
  }, [dialogRef, stop])

  return { isNarrow }
}
