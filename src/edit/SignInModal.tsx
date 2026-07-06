import { type FormEvent, useEffect, useRef, useState } from "react"

import { createPortal } from "react-dom"

import styles from "@edit/SignInModal.module.css"

import { useAuth } from "@state/useAuth"

export function SignInModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { signIn, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    emailRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true)
    const ok = await signIn(email.trim(), password)
    setBusy(false)
    if (ok) onClose()
  }

  return createPortal(
    <div className={styles.backdrop}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-modal-title"
        onSubmit={submit}
      >
        <h2 id="sign-in-modal-title" className={styles.title}>
          Sign in to sync
        </h2>
        <input
          ref={emailRef}
          className={styles.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
          placeholder="Email"
        />
        <input
          className={styles.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Password"
          placeholder="Password"
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.confirm}
            disabled={busy || !email.trim() || !password}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
