import { type FormEvent, useEffect, useRef, useState } from "react"

import styles from "@components/LoginPage.module.css"

import { cloudConfigured } from "@state/supabase"
import { useAuth } from "@state/useAuth"

import { navigate } from "@utils/navigate"

// Owner sign-in page (/login). Deliberately unlinked from public pages;
// anonymous visitors only ever see the homepage and this form.
export function LoginPage() {
  const { session, ready, signIn, error } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const signedIn = ready && session !== null

  useEffect(() => {
    // Nothing to sign in to without a configured project; already signed
    // in means there is nothing to do here either.
    if (!cloudConfigured || signedIn) navigate("/")
  }, [signedIn])

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  if (!cloudConfigured || !ready || session) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true)
    await signIn(email.trim(), password)
    setBusy(false)
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} aria-label="Sign in" onSubmit={submit}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.hint}>This page is for the site owner.</p>
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
        <button
          type="submit"
          className={styles.submit}
          disabled={busy || !email.trim() || !password}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <a className={styles.back} href="/">
          Back to resume
        </a>
      </form>
    </div>
  )
}
